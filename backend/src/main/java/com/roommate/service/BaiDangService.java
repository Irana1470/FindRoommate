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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BaiDangService {

    private final BaiDangRepository baiDangRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final PhongRepository phongRepo;
    private final ObjectMapper objectMapper;

    @Value("${app.upload.dir:uploads}")
    private String uploadRootDir;

    @Transactional
    public BaiDangDTO.Response taoBaiDang(Integer maNguoiDung, BaiDangDTO.TaoBaiDangRequest req) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));

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
                    .orElseThrow(() -> new RuntimeException("Khong tim thay phong"));
            bd.setPhong(phong);
        }

        return toResponse(baiDangRepo.save(bd));
    }

    @Transactional
    public BaiDangDTO.Response capNhatBaiDang(Integer maBaiDang, Integer maNguoiDung,
                                              BaiDangDTO.CapNhatBaiDangRequest req) {
        BaiDang bd = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Khong tim thay bai dang"));

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
                    .orElseThrow(() -> new RuntimeException("Khong tim thay phong"));
            bd.setPhong(phong);
        } else {
            bd.setPhong(null);
        }

        return toResponse(baiDangRepo.saveAndFlush(bd));
    }

    @Transactional
    public BaiDangDTO.MediaUploadResponse uploadMedia(Integer maBaiDang, Integer maNguoiDung,
                                                      List<MultipartFile> files) throws IOException {
        BaiDang bd = baiDangRepo.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Khong tim thay bai dang"));
        validateOwner(bd, maNguoiDung, "upload media cho");

        if (files == null || files.isEmpty()) {
            throw new RuntimeException("Vui long chon media hop le");
        }

        Path uploadDir = Paths.get(uploadRootDir, "baidang").toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);

        List<String> uploadedImages = new ArrayList<>();
        String uploadedVideo = null;

        List<String> existingImages = new ArrayList<>();
        if (bd.getImages() != null) {
            try {
                existingImages = objectMapper.readValue(bd.getImages(), new TypeReference<>() {});
            } catch (Exception ignored) {
            }
        }

        for (MultipartFile file : files) {
            validateMedia(file);
            String contentType = file.getContentType().toLowerCase(Locale.ROOT);

            if (contentType.startsWith("image/")) {
                String name = "bd_" + maBaiDang + "_" + System.currentTimeMillis() + getExt(file.getOriginalFilename());
                Files.copy(file.getInputStream(), uploadDir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
                uploadedImages.add("/uploads/baidang/" + name);
                continue;
            }

            if (uploadedVideo != null) {
                throw new RuntimeException("Moi bai dang chi ho tro 1 video");
            }

            String name = "bd_video_" + maBaiDang + "_" + System.currentTimeMillis() + getExt(file.getOriginalFilename());
            Files.copy(file.getInputStream(), uploadDir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            uploadedVideo = "/uploads/baidang/" + name;
        }

        existingImages.addAll(uploadedImages);
        bd.setImages(toImagesJson(existingImages));
        if (uploadedVideo != null) {
            bd.setVideo(uploadedVideo);
        }
        baiDangRepo.save(bd);

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
                .orElseThrow(() -> new RuntimeException("Khong tim thay bai dang"));
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
                .orElseThrow(() -> new RuntimeException("Khong tim thay bai dang"));
        validateOwner(bd, maNguoiDung, "xoa");
        baiDangRepo.delete(bd);
    }

    private void validateOwner(BaiDang bd, Integer maNguoiDung, String action) {
        if (!bd.getNguoiDang().getMaNguoiDung().equals(maNguoiDung)) {
            throw new RuntimeException("Ban khong co quyen " + action + " bai dang nay");
        }
    }

    private String normalizeTrangThai(String trangThai) {
        if (trangThai == null) {
            return "Dang";
        }

        String normalized = trangThai.trim();
        if (!List.of("Dang", "Tam dung", "Da dong").contains(normalized)) {
            throw new RuntimeException("Trang thai bai dang khong hop le");
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

    private String getExt(String filename) {
        if (filename == null) {
            return ".jpg";
        }
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot).toLowerCase(Locale.ROOT) : ".jpg";
    }

    private String toImagesJson(List<String> images) {
        try {
            return objectMapper.writeValueAsString(images);
        } catch (IOException e) {
            throw new RuntimeException("Khong the luu danh sach anh bai dang", e);
        }
    }

    private void validateMedia(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui long chon media hop le");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new RuntimeException("Khong xac dinh duoc loai file");
        }

        String normalized = contentType.toLowerCase(Locale.ROOT);
        if (!normalized.startsWith("image/") && !normalized.startsWith("video/")) {
            throw new RuntimeException("File upload phai la anh hoac video");
        }
    }
}
