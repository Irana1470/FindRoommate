package com.roommate.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roommate.dto.BaiDangDTO;
import com.roommate.model.BaiDang;
import com.roommate.model.NguoiDung;
import com.roommate.model.Phong;
import com.roommate.repository.BaiDangRepository;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.PhongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BaiDangService {

    private static final int MAX_PARALLEL_IMAGE_UPLOADS = 3;

    private final BaiDangRepository baiDangRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final PhongRepository phongRepo;
    private final ObjectMapper objectMapper;
    private final CloudinaryMediaService cloudinaryMediaService;
    private final NguoiDungService nguoiDungService;

    @Transactional
    public BaiDangDTO.Response taoBaiDang(Integer maNguoiDung, BaiDangDTO.TaoBaiDangRequest req) {
        nguoiDungService.yeuCauTaiKhoanKhongBiHanChe(maNguoiDung, NguoiDungService.LoaiHanChe.DANG_BAI);
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        BaiDang bd = BaiDang.builder()
                .nguoiDang(nd)
                .moTa(req.getMoTa())
                .noiDung(req.getNoiDung())
                .giaTien(req.getGiaTien())
                .tinhThanh(req.getTinhThanh())
                .quanHuyen(req.getQuanHuyen())
                .diaChi(req.getDiaChi())
                .trangThai("Dang")
                .soLuotXem(0)
                .ngayHetHan(req.getNgayHetHan())
                .build();

        if (req.getMaPhong() != null) {
            Phong phong = phongRepo.findById(req.getMaPhong())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));
            bd.setPhong(phong);
        }

        return toResponse(baiDangRepo.save(bd));
    }

    @Transactional
    public BaiDangDTO.Response capNhatBaiDang(Integer maBaiDang, Integer maNguoiDung,
                                              BaiDangDTO.CapNhatBaiDangRequest req) {
        nguoiDungService.yeuCauTaiKhoanKhongBiHanChe(maNguoiDung, NguoiDungService.LoaiHanChe.DANG_BAI);
        BaiDang bd = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

        validateOwner(bd, maNguoiDung, "cap nhat");

        bd.setMoTa(req.getMoTa());
        bd.setNoiDung(req.getNoiDung());
        bd.setGiaTien(req.getGiaTien());
        bd.setTinhThanh(req.getTinhThanh());
        bd.setQuanHuyen(req.getQuanHuyen());
        bd.setDiaChi(req.getDiaChi());
        bd.setNgayHetHan(req.getNgayHetHan());
        bd.setTrangThai(normalizeTrangThai(req.getTrangThai()));
        List<String> normalizedImages = req.getImages() == null
                ? new ArrayList<>()
                : req.getImages().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(image -> !image.isEmpty())
                .collect(Collectors.toCollection(ArrayList::new));
        bd.setImages(toImagesJson(normalizedImages));
        if (req.getVideo() != null) {
            String video = req.getVideo().trim();
            bd.setVideo(video.isEmpty() ? null : video);
        }

        if (req.getMaPhong() != null) {
            Phong phong = phongRepo.findById(req.getMaPhong())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));
            bd.setPhong(phong);
        } else {
            bd.setPhong(null);
        }

        return toResponse(baiDangRepo.saveAndFlush(bd));
    }

    public BaiDangDTO.MediaUploadResponse uploadMedia(Integer maBaiDang, Integer maNguoiDung,
                                                      List<MultipartFile> files) throws IOException {
        BaiDang bd = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        validateOwner(bd, maNguoiDung, "upload media cho");

        if (files == null || files.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn media hợp lệ");
        }

        List<String> existingImages = new ArrayList<>();
        if (bd.getImages() != null) {
            try {
                existingImages = objectMapper.readValue(bd.getImages(), new TypeReference<>() {});
            } catch (Exception ignored) {
            }
        }

        List<MultipartFile> imageFiles = new ArrayList<>();
        MultipartFile videoFile = null;

        for (MultipartFile file : files) {
            validateMedia(file);
            String contentType = file.getContentType().toLowerCase(Locale.ROOT);

            if (contentType.startsWith("image/")) {
                imageFiles.add(file);
                continue;
            }

            if (videoFile != null) {
                throw new RuntimeException("Moi bai dang chi ho tro 1 video");
            }

            videoFile = file;
        }

        List<String> uploadedImages = uploadImagesInParallel(imageFiles, "roommate/baidang/images");
        String uploadedVideo = videoFile == null
                ? null
                : cloudinaryMediaService.upload(videoFile, "roommate/baidang/videos").getUrl();

        existingImages.addAll(uploadedImages);
        bd.setImages(toImagesJson(existingImages));
        if (uploadedVideo != null) {
            bd.setVideo(uploadedVideo);
        }
        saveUploadedMedia(bd);

        return BaiDangDTO.MediaUploadResponse.builder()
                .images(uploadedImages)
                .video(uploadedVideo)
                .build();
    }

    public Page<BaiDangDTO.Response> timKiem(BigDecimal giaTienMin, BigDecimal giaTienMax,
                                             String diaChi, String tuKhoa, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("ngayDang").descending());
        return baiDangRepo.timKiemBaiDang(giaTienMin, giaTienMax, diaChi, tuKhoa, pageable)
                .map(this::toResponse);
    }

    public BaiDangDTO.Response layChiTiet(Integer maBaiDang) {
        BaiDang bd = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        bd.setSoLuotXem(bd.getSoLuotXem() + 1);
        baiDangRepo.save(bd);
        return toResponse(bd);
    }

    public List<BaiDangDTO.Response> layBaiDangCuaUser(Integer maNguoiDung) {
        return baiDangRepo.findByNguoiDang_MaNguoiDung(maNguoiDung)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void xoaBaiDang(Integer maBaiDang, Integer maNguoiDung) {
        BaiDang bd = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        validateOwner(bd, maNguoiDung, "xoa");
        baiDangRepo.delete(bd);
    }

    @Transactional
    public void xoaBaiDangByAdmin(Integer maBaiDang) {
        BaiDang bd = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        baiDangRepo.delete(bd);
    }

    private void validateOwner(BaiDang bd, Integer maNguoiDung, String action) {
        if (!bd.getNguoiDang().getMaNguoiDung().equals(maNguoiDung)) {
            throw new RuntimeException("Bạn không có quyền " + action + " bài đăng này");
        }
    }

    private String normalizeTrangThai(String trangThai) {
        if (trangThai == null) {
            return "Dang";
        }

        String normalized = trangThai.trim();
        if (!List.of("Dang", "Tam dung", "Da dong").contains(normalized)) {
            throw new RuntimeException("Trạng thái bài đăng không hợp lệ");
        }
        return normalized;
    }

    private BaiDangDTO.Response toResponse(BaiDang b) {
        List<String> imgs = new ArrayList<>();
        if (b.getImages() != null) {
            try {
                imgs = objectMapper.readValue(b.getImages(), new TypeReference<>() {});
            } catch (Exception ignored) {
            }
        }

        return BaiDangDTO.Response.builder()
                .maBaiDang(b.getMaBaiDang())
                .maNguoiDang(b.getNguoiDang().getMaNguoiDung())
                .tenNguoiDang(b.getNguoiDang().getHoTen())
                .avatarNguoiDang(b.getNguoiDang().getAvatar())
                .maPhong(b.getPhong() != null ? b.getPhong().getMaPhong() : null)
                .tenPhong(b.getPhong() != null ? b.getPhong().getTitle() : null)
                .soNguoiHienTaiPhong(b.getPhong() != null ? b.getPhong().getSoNguoiHienTai() : null)
                .soNguoiToiDaPhong(b.getPhong() != null ? b.getPhong().getSoNguoiToiDa() : null)
                .trangThaiPhong(b.getPhong() != null ? b.getPhong().getTrangThai() : null)
                .moTa(b.getMoTa())
                .noiDung(b.getNoiDung())
                .giaTien(b.getGiaTien())
                .tinhThanh(b.getTinhThanh())
                .quanHuyen(b.getQuanHuyen())
                .diaChi(b.getDiaChi())
                .images(imgs)
                .video(b.getVideo())
                .trangThai(b.getTrangThai())
                .soLuotXem(b.getSoLuotXem())
                .ngayDang(b.getNgayDang())
                .build();
    }

    private String toImagesJson(List<String> images) {
        try {
            return objectMapper.writeValueAsString(images);
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu danh sách ảnh bài đăng", e);
        }
    }

    @Transactional
    protected void saveUploadedMedia(BaiDang baiDang) {
        baiDangRepo.save(baiDang);
    }

    private List<String> uploadImagesInParallel(List<MultipartFile> imageFiles, String folder) throws IOException {
        if (imageFiles.isEmpty()) {
            return new ArrayList<>();
        }

        int poolSize = Math.min(imageFiles.size(), MAX_PARALLEL_IMAGE_UPLOADS);
        ExecutorService executor = Executors.newFixedThreadPool(poolSize);

        try {
            List<CompletableFuture<String>> futures = imageFiles.stream()
                    .map(file -> CompletableFuture.supplyAsync(() -> {
                        try {
                            return cloudinaryMediaService.upload(file, folder).getUrl();
                        } catch (IOException ex) {
                            throw new CompletionException(ex);
                        }
                    }, executor))
                    .toList();

            List<String> uploadedImages = new ArrayList<>(futures.size());
            for (CompletableFuture<String> future : futures) {
                try {
                    uploadedImages.add(future.join());
                } catch (CompletionException ex) {
                    Throwable cause = ex.getCause();
                    if (cause instanceof IOException ioException) {
                        throw ioException;
                    }
                    if (cause instanceof RuntimeException runtimeException) {
                        throw runtimeException;
                    }
                    throw new RuntimeException("Không thể upload ảnh bài đăng", cause);
                }
            }
            return uploadedImages;
        } finally {
            executor.shutdown();
        }
    }

    private void validateMedia(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn media hợp lệ");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new RuntimeException("Không xác định được loại file");
        }

        String normalized = contentType.toLowerCase(Locale.ROOT);
        if (!normalized.startsWith("image/") && !normalized.startsWith("video/")) {
            throw new RuntimeException("File upload phai la anh hoac video");
        }
    }
}
