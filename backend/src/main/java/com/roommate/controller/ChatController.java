package com.roommate.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommate.dto.ApiResponse;
import com.roommate.model.BaoCaoHoiThoai;
import com.roommate.model.CuocGoi;
import com.roommate.model.NguoiDung;
import com.roommate.model.TinNhan;
import com.roommate.repository.BaoCaoHoiThoaiRepository;
import com.roommate.repository.CuocGoiRepository;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.TinNhanRepository;
import com.roommate.service.ChatMediaService;
import com.roommate.service.ChatPresenceService;
import com.roommate.service.NguoiDungService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private static final int DEFAULT_MESSAGE_LIMIT = 30;
    private static final int MAX_MESSAGE_LIMIT = 100;

    private final TinNhanRepository tinNhanRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final CuocGoiRepository cuocGoiRepo;
    private final BaoCaoHoiThoaiRepository baoCaoHoiThoaiRepo;
    private final NguoiDungService nguoiDungService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatPresenceService chatPresenceService;
    private final ChatMediaService chatMediaService;
    private final ObjectMapper objectMapper;

    private final Map<String, Deque<Long>> sendRateLimiter = new ConcurrentHashMap<>();

    @GetMapping("/api/chat/{maNguoiKia:\\d+}")
    public ApiResponse<ConversationHistoryDTO> layLichSu(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maNguoiKia,
            @RequestParam(required = false) String before,
            @RequestParam(defaultValue = "30") Integer limit
    ) {
        NguoiDung currentUser = layNguoiDungHienTai(ud.getUsername());
        NguoiDung partner = layNguoiDung(maNguoiKia);
        LocalDateTime beforeTime = parseDateTime(before);
        int pageSize = Math.max(1, Math.min(limit != null ? limit : DEFAULT_MESSAGE_LIMIT, MAX_MESSAGE_LIMIT));

        List<TinNhan> visibleMessages = tinNhanRepo.findConversation(
                        currentUser.getMaNguoiDung(),
                        maNguoiKia
                ).stream()
                .filter(tinNhan -> !isHiddenForUser(tinNhan, currentUser.getMaNguoiDung()))
                .filter(tinNhan -> beforeTime == null || (tinNhan.getThoiGian() != null && tinNhan.getThoiGian().isBefore(beforeTime)))
                .sorted(Comparator.comparing(TinNhan::getThoiGian, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        boolean hasMore = visibleMessages.size() > pageSize;
        int fromIndex = Math.max(0, visibleMessages.size() - pageSize);

        List<TinNhanDTO> items = visibleMessages.subList(fromIndex, visibleMessages.size()).stream()
                .map(this::toDTO)
                .sorted(Comparator.comparing(TinNhanDTO::getThoiGianNullable, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        return ApiResponse.ok(ConversationHistoryDTO.builder()
                .partner(toPartnerDTO(partner))
                .items(items)
                .hasMore(hasMore)
                .build());
    }

    @GetMapping("/api/chat/conversations")
    public ApiResponse<List<ConversationDTO>> layDanhSachHoiThoai(@AuthenticationPrincipal UserDetails ud) {
        Integer myId = layNguoiDungHienTai(ud.getUsername()).getMaNguoiDung();
        Map<Integer, ConversationDTO> conversations = new LinkedHashMap<>();

        for (TinNhan tinNhan : tinNhanRepo.findAllRelatedMessages(myId)) {
            if (isHiddenForUser(tinNhan, myId)) {
                continue;
            }

            boolean outgoing = tinNhan.getNguoiGui().getMaNguoiDung().equals(myId);
            NguoiDung partner = outgoing ? tinNhan.getNguoiNhan() : tinNhan.getNguoiGui();
            if (conversations.containsKey(partner.getMaNguoiDung())) {
                continue;
            }

            int unreadCount = (int) tinNhanRepo.findUnreadMessages(myId, partner.getMaNguoiDung()).stream()
                    .filter(message -> !isHiddenForUser(message, myId))
                    .count();
            conversations.put(partner.getMaNguoiDung(), ConversationDTO.builder()
                    .maNguoiKia(partner.getMaNguoiDung())
                    .tenNguoiKia(partner.getHoTen())
                    .avatarNguoiKia(partner.getAvatar())
                    .tinNhanCuoi(buildPreviewText(tinNhan))
                    .thoiGian(tinNhan.getThoiGian() != null ? tinNhan.getThoiGian().toString() : null)
                    .laTinCuaToi(outgoing)
                    .trangThaiTinNhan(tinNhan.getTrangThai())
                    .online(chatPresenceService.isOnline(partner.getEmail()))
                    .lastActive(formatDateTime(chatPresenceService.getLastActive(partner.getEmail())))
                    .chuaDoc(unreadCount)
                    .build());
        }

        return ApiResponse.ok(List.copyOf(conversations.values()));
    }

    @GetMapping("/api/chat/presence")
    public ApiResponse<List<PresenceDTO>> layPresence(@RequestParam List<Integer> userIds) {
        List<PresenceDTO> presence = userIds.stream()
                .distinct()
                .map(this::layNguoiDung)
                .map(this::toPresenceDTO)
                .collect(Collectors.toList());
        return ApiResponse.ok(presence);
    }

    @GetMapping("/api/chat/webrtc-config")
    public ApiResponse<Map<String, Object>> layWebRtcConfig() {
        return ApiResponse.ok(Map.of(
                "iceServers", List.of(
                        Map.of("urls", List.of("stun:stun.l.google.com:19302")),
                        Map.of("urls", List.of("stun:global.stun.twilio.com:3478"))
                )
        ));
    }

    @PostMapping(value = "/api/chat/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TinNhanDTO> guiTinNhan(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam Integer maNguoiNhan,
            @RequestParam(required = false) String noiDung,
            @RequestParam(required = false) Integer replyTo,
            @RequestParam(required = false) MultipartFile file
    ) throws IOException {
        NguoiDung nguoiGui = layNguoiDungHienTai(ud.getUsername());
        TinNhan saved = taoTinNhan(nguoiGui, maNguoiNhan, noiDung, replyTo, file);
        TinNhanDTO dto = toDTO(saved);
        broadcastMessageEvent("receive_message", dto, saved.getNguoiNhan(), saved.getNguoiGui());
        return ApiResponse.ok(dto);
    }

    @DeleteMapping("/api/chat/conversations/{maNguoiKia}")
    public ApiResponse<Map<String, Object>> xoaHoiThoai(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maNguoiKia
    ) {
        NguoiDung currentUser = layNguoiDungHienTai(ud.getUsername());
        layNguoiDung(maNguoiKia);

        List<TinNhan> conversationMessages = tinNhanRepo.findConversation(currentUser.getMaNguoiDung(), maNguoiKia);
        int affected = 0;

        for (TinNhan tinNhan : conversationMessages) {
            if (!isHiddenForUser(tinNhan, currentUser.getMaNguoiDung())) {
                hideMessageForUser(tinNhan, currentUser.getMaNguoiDung());
                affected++;
            }
        }

        if (affected > 0) {
            tinNhanRepo.saveAll(conversationMessages);
        }

        return ApiResponse.ok(Map.of(
                "conversationId", buildConversationId(currentUser.getMaNguoiDung(), maNguoiKia),
                "deletedMessages", affected
        ));
    }

    @PostMapping("/api/chat/conversations/{maNguoiKia}/report")
    public ApiResponse<Map<String, Object>> baoCaoHoiThoai(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer maNguoiKia,
            @RequestBody ReportConversationRequest request
    ) {
        NguoiDung currentUser = layNguoiDungHienTai(ud.getUsername());
        NguoiDung reportedUser = layNguoiDung(maNguoiKia);
        String lyDo = safeTrim(request.getLyDo());
        String chiTiet = safeTrim(request.getChiTiet());

        if (lyDo == null || lyDo.isBlank()) {
            throw new RuntimeException("Vui long nhap ly do bao cao");
        }
        if (lyDo.length() > 120) {
            throw new RuntimeException("Ly do bao cao khong duoc vuot qua 120 ky tu");
        }
        if (chiTiet != null && chiTiet.length() > 2000) {
            throw new RuntimeException("Chi tiet bao cao khong duoc vuot qua 2000 ky tu");
        }

        TinNhan latestMessage = tinNhanRepo.findConversation(currentUser.getMaNguoiDung(), maNguoiKia).stream()
                .filter(tinNhan -> !isHiddenForUser(tinNhan, currentUser.getMaNguoiDung()))
                .max(Comparator.comparing(TinNhan::getThoiGian, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);

        BaoCaoHoiThoai baoCao = baoCaoHoiThoaiRepo.save(BaoCaoHoiThoai.builder()
                .nguoiBaoCao(currentUser)
                .nguoiBiBaoCao(reportedUser)
                .conversationId(buildConversationId(currentUser.getMaNguoiDung(), maNguoiKia))
                .lyDo(lyDo)
                .chiTiet(chiTiet)
                .tinNhanGanNhat(latestMessage != null ? buildPreviewText(latestMessage) : null)
                .trangThai("NEW")
                .build());

        return ApiResponse.ok(Map.of(
                "maBaoCao", baoCao.getMaBaoCao(),
                "trangThai", baoCao.getTrangThai()
        ));
    }

    @PostMapping(value = "/api/chat/send", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<TinNhanDTO> guiTinNhanJson(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody SendMessageRequest request
    ) throws IOException {
        NguoiDung nguoiGui = layNguoiDungHienTai(ud.getUsername());
        TinNhan saved = taoTinNhan(nguoiGui, request.getMaNguoiNhan(), request.getNoiDung(), request.getReplyTo(), null);
        TinNhanDTO dto = toDTO(saved);
        broadcastMessageEvent("receive_message", dto, saved.getNguoiNhan(), saved.getNguoiGui());
        return ApiResponse.ok(dto);
    }

    @PutMapping("/api/chat/messages/{messageId}/seen")
    public ApiResponse<TinNhanDTO> danhDauDaXem(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer messageId
    ) {
        NguoiDung currentUser = layNguoiDungHienTai(ud.getUsername());
        TinNhan tinNhan = layTinNhanCoQuyen(messageId, currentUser.getMaNguoiDung());
        validateRecipient(tinNhan, currentUser.getMaNguoiDung());
        if (tinNhan.getThoiGianDaXem() == null) {
            addReceiptUser(tinNhan, currentUser.getMaNguoiDung(), true);
            tinNhan.setTrangThai("SEEN");
            tinNhan.setThoiGianDaNhan(tinNhan.getThoiGianDaNhan() != null ? tinNhan.getThoiGianDaNhan() : LocalDateTime.now());
            tinNhan.setThoiGianDaXem(LocalDateTime.now());
            tinNhanRepo.save(tinNhan);
        }
        TinNhanDTO dto = toDTO(tinNhan);
        broadcastMessageEvent("seen_message", dto, tinNhan.getNguoiGui(), tinNhan.getNguoiNhan());
        return ApiResponse.ok(dto);
    }

    @PutMapping("/api/chat/messages/{messageId}/delivered")
    public ApiResponse<TinNhanDTO> danhDauDaNhan(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer messageId
    ) {
        NguoiDung currentUser = layNguoiDungHienTai(ud.getUsername());
        TinNhan tinNhan = layTinNhanCoQuyen(messageId, currentUser.getMaNguoiDung());
        validateRecipient(tinNhan, currentUser.getMaNguoiDung());
        capNhatDaNhanNeuCan(tinNhan);
        TinNhanDTO dto = toDTO(tinNhan);
        broadcastMessageEvent("delivered_message", dto, tinNhan.getNguoiGui(), tinNhan.getNguoiNhan());
        return ApiResponse.ok(dto);
    }

    @PutMapping("/api/chat/messages/{messageId}/recall")
    public ApiResponse<TinNhanDTO> thuHoiTinNhan(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer messageId
    ) {
        NguoiDung currentUser = layNguoiDungHienTai(ud.getUsername());
        TinNhan tinNhan = layTinNhanCoQuyen(messageId, currentUser.getMaNguoiDung());
        validateSender(tinNhan, currentUser.getMaNguoiDung());

        tinNhan.setDaThuHoi(true);
        tinNhan.setNoiDung("Tin nhắn đã được thu hồi");
        tinNhan.setTepUrl(null);
        tinNhan.setTepTenGoc(null);
        tinNhan.setTepMimeType(null);
        tinNhan.setTepKichThuoc(null);
        tinNhanRepo.save(tinNhan);

        TinNhanDTO dto = toDTO(tinNhan);
        broadcastMessageEvent("message_recalled", dto, tinNhan.getNguoiNhan(), tinNhan.getNguoiGui());
        return ApiResponse.ok(dto);
    }

    @PutMapping("/api/chat/messages/{messageId}/delete")
    public ApiResponse<TinNhanDTO> xoaPhiaNguoiGui(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer messageId
    ) {
        NguoiDung currentUser = layNguoiDungHienTai(ud.getUsername());
        TinNhan tinNhan = layTinNhanCoQuyen(messageId, currentUser.getMaNguoiDung());
        validateSender(tinNhan, currentUser.getMaNguoiDung());
        tinNhan.setDaXoaBoiNguoiGui(true);
        tinNhanRepo.save(tinNhan);
        return ApiResponse.ok(toDTO(tinNhan));
    }

    @PutMapping("/api/chat/messages/{messageId}/edit")
    public ApiResponse<TinNhanDTO> suaTinNhan(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer messageId,
            @RequestBody EditMessageRequest request
    ) {
        NguoiDung currentUser = layNguoiDungHienTai(ud.getUsername());
        TinNhan tinNhan = layTinNhanCoQuyen(messageId, currentUser.getMaNguoiDung());
        validateSender(tinNhan, currentUser.getMaNguoiDung());
        if (tinNhan.getDaThuHoi()) {
            throw new RuntimeException("Không thể sửa tin nhắn đã thu hồi");
        }

        String content = safeTrim(request.getNoiDung());
        if (content == null || content.isBlank()) {
            throw new RuntimeException("Nội dung chỉnh sửa không được để trống");
        }
        if (content.length() > 2000) {
            throw new RuntimeException("Nội dung tin nhắn không được vượt quá 2000 ký tự");
        }

        tinNhan.setNoiDung(content);
        tinNhan.setDaChinhSua(true);
        tinNhanRepo.save(tinNhan);

        TinNhanDTO dto = toDTO(tinNhan);
        broadcastMessageEvent("message_edited", dto, tinNhan.getNguoiNhan(), tinNhan.getNguoiGui());
        return ApiResponse.ok(dto);
    }

    @PostMapping("/api/chat/messages/{messageId}/reactions")
    public ApiResponse<TinNhanDTO> capNhatReaction(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Integer messageId,
            @RequestBody ReactionRequest request
    ) {
        NguoiDung currentUser = layNguoiDungHienTai(ud.getUsername());
        TinNhan tinNhan = layTinNhanCoQuyen(messageId, currentUser.getMaNguoiDung());
        String emoji = safeTrim(request.getEmoji());
        if (emoji == null || emoji.length() > 10) {
            throw new RuntimeException("Reaction emoji không hợp lệ");
        }

        Map<String, String> reactions = parseReactions(tinNhan.getReactionsJson());
        String key = String.valueOf(currentUser.getMaNguoiDung());
        if ("remove".equalsIgnoreCase(request.getAction())) {
            reactions.remove(key);
        } else {
            reactions.put(key, emoji);
        }
        tinNhan.setReactionsJson(writeReactions(reactions));
        tinNhanRepo.save(tinNhan);

        TinNhanDTO dto = toDTO(tinNhan);
        broadcastMessageEvent("message_reaction", dto, tinNhan.getNguoiNhan(), tinNhan.getNguoiGui());
        return ApiResponse.ok(dto);
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingEvent event, Principal principal) {
        NguoiDung currentUser = layNguoiDungHienTai(principal.getName());
        NguoiDung recipient = layNguoiDung(event.getMaNguoiNhan());
        chatPresenceService.touch(currentUser.getEmail());
        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/chat", Map.of(
                "event", event.isDangNhap() ? "typing" : "stop_typing",
                "userId", currentUser.getMaNguoiDung(),
                "name", currentUser.getHoTen(),
                "conversationId", buildConversationId(currentUser.getMaNguoiDung(), recipient.getMaNguoiDung())
        ));
    }

    @MessageMapping("/chat.delivered")
    public void delivered(@Payload MessageActionEvent event, Principal principal) {
        NguoiDung currentUser = layNguoiDungHienTai(principal.getName());
        TinNhan tinNhan = layTinNhanCoQuyen(event.getMessageId(), currentUser.getMaNguoiDung());
        validateRecipient(tinNhan, currentUser.getMaNguoiDung());
        capNhatDaNhanNeuCan(tinNhan);
        broadcastMessageEvent("delivered_message", toDTO(tinNhan), tinNhan.getNguoiGui(), tinNhan.getNguoiNhan());
    }

    @MessageMapping("/chat.seen")
    public void seen(@Payload MessageActionEvent event, Principal principal) {
        NguoiDung currentUser = layNguoiDungHienTai(principal.getName());
        TinNhan tinNhan = layTinNhanCoQuyen(event.getMessageId(), currentUser.getMaNguoiDung());
        validateRecipient(tinNhan, currentUser.getMaNguoiDung());
        if (tinNhan.getThoiGianDaXem() == null) {
            addReceiptUser(tinNhan, currentUser.getMaNguoiDung(), true);
            tinNhan.setTrangThai("SEEN");
            tinNhan.setThoiGianDaNhan(tinNhan.getThoiGianDaNhan() != null ? tinNhan.getThoiGianDaNhan() : LocalDateTime.now());
            tinNhan.setThoiGianDaXem(LocalDateTime.now());
            tinNhanRepo.save(tinNhan);
        }
        broadcastMessageEvent("seen_message", toDTO(tinNhan), tinNhan.getNguoiGui(), tinNhan.getNguoiNhan());
    }

    @MessageMapping("/chat.presence")
    public void pingPresence(Principal principal) {
        if (principal == null) {
            return;
        }
        NguoiDung currentUser = layNguoiDungHienTai(principal.getName());
        chatPresenceService.markOnline(currentUser.getEmail());
        messagingTemplate.convertAndSend("/topic/presence", toPresenceDTO(currentUser));
    }

    @MessageMapping("/chat.call")
    public void xuLyCallSignal(@Payload CallSignalEvent event, Principal principal) {
        NguoiDung currentUser = layNguoiDungHienTai(principal.getName());
        NguoiDung recipient = layNguoiDung(event.getToUserId());
        if (currentUser.getMaNguoiDung().equals(recipient.getMaNguoiDung())) {
            throw new RuntimeException("Không thể gọi cho chính mình");
        }

        if ("incoming_call".equals(event.getEvent())) {
            CuocGoi cuocGoi = cuocGoiRepo.findByCallId(event.getCallId())
                    .orElseGet(() -> cuocGoiRepo.save(CuocGoi.builder()
                            .callId(event.getCallId())
                            .nguoiGoi(currentUser)
                            .nguoiNhan(recipient)
                            .kieuCuocGoi(event.getCallType())
                            .trangThai("RINGING")
                            .build()));
            event.setCallType(cuocGoi.getKieuCuocGoi());
        } else if ("accept_call".equals(event.getEvent())) {
            CuocGoi cuocGoi = layCuocGoi(event.getCallId());
            cuocGoi.setTrangThai("ACCEPTED");
            cuocGoi.setBatDauLuc(LocalDateTime.now());
            cuocGoiRepo.save(cuocGoi);
        } else if ("reject_call".equals(event.getEvent())) {
            ketThucCuocGoi(event.getCallId(), "REJECTED");
        } else if ("end_call".equals(event.getEvent())) {
            ketThucCuocGoi(event.getCallId(), "ENDED");
        }

        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/call", enrichCallEvent(event, currentUser));
    }

    private TinNhan taoTinNhan(
            NguoiDung nguoiGui,
            Integer maNguoiNhan,
            String rawContent,
            Integer replyTo,
            MultipartFile file
    ) throws IOException {
        ensureRateLimit(nguoiGui.getEmail());

        NguoiDung nguoiNhan = layNguoiDung(maNguoiNhan);
        if (nguoiGui.getMaNguoiDung().equals(nguoiNhan.getMaNguoiDung())) {
            throw new RuntimeException("Không thể nhắn tin cho chính mình");
        }

        String content = safeTrim(rawContent);
        ChatMediaService.UploadedAttachment attachment = file != null && !file.isEmpty()
                ? chatMediaService.storeChatAttachment(file)
                : null;

        if ((content == null || content.isBlank()) && attachment == null) {
            throw new RuntimeException("Tin nhắn cần có nội dung hoặc file đính kèm");
        }
        if (content != null && content.length() > 2000) {
            throw new RuntimeException("Nội dung tin nhắn không được vượt quá 2000 ký tự");
        }

        TinNhan replyMessage = null;
        if (replyTo != null) {
            replyMessage = layTinNhanCoQuyen(replyTo, nguoiGui.getMaNguoiDung());
        }

        TinNhan tinNhan = TinNhan.builder()
                .nguoiGui(nguoiGui)
                .nguoiNhan(nguoiNhan)
                .conversationId(buildConversationId(nguoiGui.getMaNguoiDung(), nguoiNhan.getMaNguoiDung()))
                .noiDung(content)
                .loaiTinNhan(attachment != null ? attachment.getMessageType() : "TEXT")
                .tepUrl(attachment != null ? attachment.getUrl() : null)
                .tepTenGoc(attachment != null ? attachment.getOriginalName() : null)
                .tepMimeType(attachment != null ? attachment.getMimeType() : null)
                .tepKichThuoc(attachment != null ? attachment.getSize() : null)
                .tinNhanTraLoi(replyMessage)
                .trangThai(chatPresenceService.isOnline(nguoiNhan.getEmail()) ? "DELIVERED" : "SENT")
                .deliveredToJson(chatPresenceService.isOnline(nguoiNhan.getEmail()) ? writeUserIds(Set.of(nguoiNhan.getMaNguoiDung())) : null)
                .seenByJson(null)
                .thoiGianDaNhan(chatPresenceService.isOnline(nguoiNhan.getEmail()) ? LocalDateTime.now() : null)
                .build();

        return tinNhanRepo.save(tinNhan);
    }

    private void ensureRateLimit(String email) {
        long now = System.currentTimeMillis();
        Deque<Long> hits = sendRateLimiter.computeIfAbsent(email, ignored -> new ArrayDeque<>());
        synchronized (hits) {
            while (!hits.isEmpty() && now - hits.peekFirst() > 10_000) {
                hits.pollFirst();
            }
            if (hits.size() >= 8) {
                throw new RuntimeException("Bạn đang gửi tin quá nhanh, vui lòng thử lại sau vài giây");
            }
            hits.addLast(now);
        }
    }

    private void capNhatDaNhanNeuCan(TinNhan tinNhan) {
        if (tinNhan.getThoiGianDaNhan() == null) {
            tinNhan.setTrangThai("DELIVERED");
            tinNhan.setThoiGianDaNhan(LocalDateTime.now());
        }
        addReceiptUser(tinNhan, tinNhan.getNguoiNhan().getMaNguoiDung(), false);
        tinNhanRepo.save(tinNhan);
    }

    private void validateSender(TinNhan tinNhan, Integer userId) {
        if (!tinNhan.getNguoiGui().getMaNguoiDung().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền thao tác với tin nhắn này");
        }
    }

    private void validateRecipient(TinNhan tinNhan, Integer userId) {
        if (!tinNhan.getNguoiNhan().getMaNguoiDung().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền thao tác với tin nhắn này");
        }
    }

    private void broadcastMessageEvent(String eventName, TinNhanDTO dto, NguoiDung recipient, NguoiDung sender) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("event", eventName);
        payload.put("message", dto);
        payload.put("conversationId", dto.getConversationId());
        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/chat", payload);
        messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/chat", payload);
    }

    private Map<String, Object> enrichCallEvent(CallSignalEvent event, NguoiDung currentUser) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("event", event.getEvent());
        payload.put("callId", event.getCallId());
        payload.put("callType", event.getCallType());
        payload.put("fromUserId", currentUser.getMaNguoiDung());
        payload.put("fromName", currentUser.getHoTen());
        payload.put("fromAvatar", currentUser.getAvatar());
        payload.put("payload", event.getPayload() != null ? event.getPayload() : Map.of());
        return payload;
    }

    private CuocGoi layCuocGoi(String callId) {
        return cuocGoiRepo.findByCallId(callId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cuộc gọi"));
    }

    private void ketThucCuocGoi(String callId, String status) {
        CuocGoi cuocGoi = layCuocGoi(callId);
        cuocGoi.setTrangThai(status);
        cuocGoi.setKetThucLuc(LocalDateTime.now());
        cuocGoi.setLyDoKetThuc(status);
        if (cuocGoi.getBatDauLuc() != null && cuocGoi.getKetThucLuc() != null) {
            cuocGoi.setThoiLuongGiay((int) Duration.between(cuocGoi.getBatDauLuc(), cuocGoi.getKetThucLuc()).getSeconds());
        }
        cuocGoiRepo.save(cuocGoi);
    }

    private PresenceDTO toPresenceDTO(NguoiDung user) {
        return PresenceDTO.builder()
                .userId(user.getMaNguoiDung())
                .email(user.getEmail())
                .online(chatPresenceService.isOnline(user.getEmail()))
                .lastActive(formatDateTime(chatPresenceService.getLastActive(user.getEmail())))
                .build();
    }

    private PartnerDTO toPartnerDTO(NguoiDung partner) {
        return PartnerDTO.builder()
                .maNguoiDung(partner.getMaNguoiDung())
                .hoTen(partner.getHoTen())
                .avatar(partner.getAvatar())
                .online(chatPresenceService.isOnline(partner.getEmail()))
                .lastActive(formatDateTime(chatPresenceService.getLastActive(partner.getEmail())))
                .build();
    }

    private TinNhanDTO toDTO(TinNhan tinNhan) {
        return TinNhanDTO.builder()
                .maTinNhan(tinNhan.getMaTinNhan())
                .maNguoiGui(tinNhan.getNguoiGui().getMaNguoiDung())
                .senderId(tinNhan.getNguoiGui().getMaNguoiDung())
                .tenNguoiGui(tinNhan.getNguoiGui().getHoTen())
                .avatarNguoiGui(tinNhan.getNguoiGui().getAvatar())
                .maNguoiNhan(tinNhan.getNguoiNhan().getMaNguoiDung())
                .conversationId(tinNhan.getConversationId() != null
                        ? tinNhan.getConversationId()
                        : buildConversationId(tinNhan.getNguoiGui().getMaNguoiDung(), tinNhan.getNguoiNhan().getMaNguoiDung()))
                .noiDung(tinNhan.getNoiDung())
                .loaiTinNhan(tinNhan.getLoaiTinNhan())
                .tepUrl(tinNhan.getTepUrl())
                .tepTenGoc(tinNhan.getTepTenGoc())
                .tepMimeType(tinNhan.getTepMimeType())
                .tepKichThuoc(tinNhan.getTepKichThuoc())
                .trangThai(tinNhan.getTrangThai())
                .deliveredTo(parseUserIds(tinNhan.getDeliveredToJson()))
                .seenBy(parseUserIds(tinNhan.getSeenByJson()))
                .recalled(Boolean.TRUE.equals(tinNhan.getDaThuHoi()))
                .deleted(Boolean.TRUE.equals(tinNhan.getDaXoaBoiNguoiGui()))
                .edited(Boolean.TRUE.equals(tinNhan.getDaChinhSua()))
                .thoiGian(formatDateTime(tinNhan.getThoiGian()))
                .thoiGianDaNhan(formatDateTime(tinNhan.getThoiGianDaNhan()))
                .thoiGianDaXem(formatDateTime(tinNhan.getThoiGianDaXem()))
                .replyTo(tinNhan.getTinNhanTraLoi() != null ? ReplyPreviewDTO.builder()
                        .maTinNhan(tinNhan.getTinNhanTraLoi().getMaTinNhan())
                        .maNguoiGui(tinNhan.getTinNhanTraLoi().getNguoiGui().getMaNguoiDung())
                        .tenNguoiGui(tinNhan.getTinNhanTraLoi().getNguoiGui().getHoTen())
                        .noiDung(buildPreviewText(tinNhan.getTinNhanTraLoi()))
                        .loaiTinNhan(tinNhan.getTinNhanTraLoi().getLoaiTinNhan())
                        .build() : null)
                .reactions(parseReactions(tinNhan.getReactionsJson()))
                .build();
    }

    private Map<String, String> parseReactions(String value) {
        if (value == null || value.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<>() {});
        } catch (JsonProcessingException ex) {
            return new LinkedHashMap<>();
        }
    }

    private String writeReactions(Map<String, String> reactions) {
        try {
            return objectMapper.writeValueAsString(reactions);
        } catch (JsonProcessingException ex) {
            throw new RuntimeException("Không thể lưu reactions");
        }
    }

    private Set<Integer> parseUserIds(String value) {
        if (value == null || value.isBlank()) {
            return new LinkedHashSet<>();
        }
        try {
            return new LinkedHashSet<>(objectMapper.readValue(value, new TypeReference<List<Integer>>() {}));
        } catch (JsonProcessingException ex) {
            return new LinkedHashSet<>();
        }
    }

    private String writeUserIds(Set<Integer> userIds) {
        try {
            return objectMapper.writeValueAsString(userIds);
        } catch (JsonProcessingException ex) {
            throw new RuntimeException("Khong the luu receipts");
        }
    }

    private void addReceiptUser(TinNhan tinNhan, Integer userId, boolean seen) {
        Set<Integer> deliveredTo = parseUserIds(tinNhan.getDeliveredToJson());
        deliveredTo.add(userId);
        tinNhan.setDeliveredToJson(writeUserIds(deliveredTo));
        if (seen) {
            Set<Integer> seenBy = parseUserIds(tinNhan.getSeenByJson());
            seenBy.add(userId);
            tinNhan.setSeenByJson(writeUserIds(seenBy));
        }
    }

    private boolean isHiddenForUser(TinNhan tinNhan, Integer userId) {
        return parseUserIds(tinNhan.getHiddenByJson()).contains(userId);
    }

    private void hideMessageForUser(TinNhan tinNhan, Integer userId) {
        Set<Integer> hiddenBy = parseUserIds(tinNhan.getHiddenByJson());
        hiddenBy.add(userId);
        tinNhan.setHiddenByJson(writeUserIds(hiddenBy));
    }

    private String buildPreviewText(TinNhan message) {
        if (Boolean.TRUE.equals(message.getDaThuHoi())) {
            return "Tin nhắn đã được thu hồi";
        }
        if ("IMAGE".equals(message.getLoaiTinNhan())) {
            return message.getNoiDung() != null && !message.getNoiDung().isBlank() ? message.getNoiDung() : "Đã gửi một ảnh";
        }
        if ("FILE".equals(message.getLoaiTinNhan())) {
            return message.getNoiDung() != null && !message.getNoiDung().isBlank() ? message.getNoiDung() : "Đã gửi một file";
        }
        return message.getNoiDung();
    }

    private TinNhan layTinNhanCoQuyen(Integer messageId, Integer userId) {
        return tinNhanRepo.findAccessibleMessage(messageId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin nhắn"));
    }

    private NguoiDung layNguoiDung(Integer userId) {
        return nguoiDungRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    private NguoiDung layNguoiDungHienTai(String email) {
        return nguoiDungService.layNguoiDungTheoEmail(email);
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDateTime.parse(value);
    }

    private String formatDateTime(LocalDateTime value) {
        return value != null ? value.toString() : null;
    }

    private String safeTrim(String value) {
        return value != null ? value.trim() : null;
    }

    private String buildConversationId(Integer userA, Integer userB) {
        int min = Math.min(userA, userB);
        int max = Math.max(userA, userB);
        return min + "_" + max;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EditMessageRequest {
        private String noiDung;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReactionRequest {
        private String emoji;
        private String action;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendMessageRequest {
        private Integer maNguoiNhan;
        private String noiDung;
        private Integer replyTo;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportConversationRequest {
        private String lyDo;
        private String chiTiet;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageActionEvent {
        private Integer messageId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypingEvent {
        private Integer maNguoiNhan;
        private boolean dangNhap;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CallSignalEvent {
        private String event;
        private String callId;
        private String callType;
        private Integer toUserId;
        private Map<String, Object> payload;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversationHistoryDTO {
        private PartnerDTO partner;
        private List<TinNhanDTO> items;
        private boolean hasMore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PartnerDTO {
        private Integer maNguoiDung;
        private String hoTen;
        private String avatar;
        private boolean online;
        private String lastActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PresenceDTO {
        private Integer userId;
        private String email;
        private boolean online;
        private String lastActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReplyPreviewDTO {
        private Integer maTinNhan;
        private Integer maNguoiGui;
        private String tenNguoiGui;
        private String noiDung;
        private String loaiTinNhan;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TinNhanDTO {
        private Integer maTinNhan;
        private Integer maNguoiGui;
        private Integer senderId;
        private String tenNguoiGui;
        private String avatarNguoiGui;
        private Integer maNguoiNhan;
        private String conversationId;
        private String noiDung;
        private String loaiTinNhan;
        private String tepUrl;
        private String tepTenGoc;
        private String tepMimeType;
        private Long tepKichThuoc;
        private String trangThai;
        private Set<Integer> deliveredTo;
        private Set<Integer> seenBy;
        private boolean recalled;
        private boolean deleted;
        private boolean edited;
        private String thoiGian;
        private String thoiGianDaNhan;
        private String thoiGianDaXem;
        private ReplyPreviewDTO replyTo;
        private Map<String, String> reactions;

        public LocalDateTime getThoiGianNullable() {
            return thoiGian != null ? LocalDateTime.parse(thoiGian) : null;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversationDTO {
        private Integer maNguoiKia;
        private String tenNguoiKia;
        private String avatarNguoiKia;
        private String tinNhanCuoi;
        private String thoiGian;
        private boolean laTinCuaToi;
        private String trangThaiTinNhan;
        private boolean online;
        private String lastActive;
        private int chuaDoc;
    }
}
