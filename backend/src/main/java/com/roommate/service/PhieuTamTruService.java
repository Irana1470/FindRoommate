package com.roommate.service;

import com.roommate.dto.PhieuTamTruDTO;
import com.roommate.model.NguoiDung;
import com.roommate.model.PhieuTamTru;
import com.roommate.model.XacThucDanhTinh;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.PhieuTamTruRepository;
import com.roommate.repository.XacThucDanhTinhRepository;
import com.roommate.util.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PhieuTamTruService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PhieuTamTruRepository phieuTamTruRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final XacThucDanhTinhRepository xacThucDanhTinhRepo;

    @Transactional
    public PhieuTamTruDTO.Response taoPhieu(Integer maNguoiDung, PhieuTamTruDTO.UpsertRequest req) {
        NguoiDung nguoiDung = layNguoiDung(maNguoiDung);

        PhieuTamTru phieu = new PhieuTamTru();
        phieu.setNguoiDung(nguoiDung);
        applyRequest(phieu, req);
        return toResponse(phieuTamTruRepo.save(phieu));
    }

    @Transactional
    public PhieuTamTruDTO.Response capNhatPhieu(Integer maPhieu, Integer maNguoiDung, PhieuTamTruDTO.UpsertRequest req) {
        PhieuTamTru phieu = layPhieuSoHuu(maPhieu, maNguoiDung, "chinh sua");

        applyRequest(phieu, req);
        return toResponse(phieuTamTruRepo.save(phieu));
    }

    @Transactional
    public void xoaPhieu(Integer maPhieu, Integer maNguoiDung) {
        PhieuTamTru phieu = layPhieuSoHuu(maPhieu, maNguoiDung, "xoa");
        phieuTamTruRepo.delete(phieu);
    }

    public List<PhieuTamTruDTO.Response> layPhieuCuaUser(Integer maNguoiDung) {
        return phieuTamTruRepo.findByNguoiDung_MaNguoiDungOrderByMaPhieuTamTruDesc(maNguoiDung)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PhieuTamTruDTO.Response layChiTiet(Integer maPhieu, Integer maNguoiDung) {
        return toResponse(layPhieuSoHuu(maPhieu, maNguoiDung, "xem"));
    }

    public PhieuTamTruDTO.Response taoBanXemTruoc(Integer maNguoiDung, PhieuTamTruDTO.UpsertRequest req) {
        NguoiDung nguoiDung = layNguoiDung(maNguoiDung);

        PhieuTamTru phieu = new PhieuTamTru();
        phieu.setNguoiDung(nguoiDung);
        applyRequest(phieu, req);
        return toResponse(phieu);
    }

    public PhieuTamTruDTO.Response layDuLieuMacDinh(Integer maNguoiDung) {
        NguoiDung nguoiDung = layNguoiDung(maNguoiDung);

        PhieuTamTru phieu = phieuTamTruRepo.findByNguoiDung_MaNguoiDungOrderByMaPhieuTamTruDesc(maNguoiDung)
                .stream()
                .findFirst()
                .orElseGet(() -> {
                    PhieuTamTru newPhieu = new PhieuTamTru();
                    newPhieu.setNguoiDung(nguoiDung);
                    return newPhieu;
                });
        if (phieu.getNguoiDung() == null) {
            phieu.setNguoiDung(nguoiDung);
        }

        return toResponse(phieu);
    }

    private void applyRequest(PhieuTamTru phieu, PhieuTamTruDTO.UpsertRequest req) {
        phieu.setPhong(null);
        phieu.setCoQuanDangKy(normalizeStoredText(req.getCoQuanDangKy(), 255, "Co quan dang ky"));
        phieu.setHoTen(normalizeOptionalName(req.getHoTen(), "Ho ten"));
        phieu.setGioiTinh(normalizeStoredText(req.getGioiTinh(), 20, "Gioi tinh"));
        phieu.setSoCanCuocCongDan(normalizeCitizenId(req.getSoCanCuocCongDan(), "So dinh danh ca nhan"));
        phieu.setSoDienThoai(normalizePhone(req.getSoDienThoai(), "So dien thoai"));
        phieu.setEmail(normalizeEmail(req.getEmail(), "Email"));
        phieu.setNgaySinh(InputValidator.validatePastOrPresent(req.getNgaySinh(), "Ngay sinh"));
        phieu.setTenChuHo(normalizeOptionalName(req.getTenChuHo(), "Ten chu ho"));
        phieu.setQuanHeVoiChuHo(normalizeStoredText(req.getQuanHeVoiChuHo(), 100, "Moi quan he voi chu ho"));
        phieu.setSoDinhDanhChuHo(normalizeCitizenId(req.getSoDinhDanhChuHo(), "So dinh danh cua chu ho"));
        phieu.setDiaChiThuongTru(normalizeStoredText(req.getDiaChiThuongTru(), 255, "Dia chi thuong tru"));
        phieu.setDiaChiTamTru(normalizeStoredText(req.getDiaChiTamTru(), 255, "Dia chi tam tru"));
        phieu.setNoiDungDeNghi(normalizeStoredText(req.getNoiDungDeNghi(), 500, "Noi dung de nghi"));
        phieu.setNgayBatDau(req.getNgayBatDau());
    }

    private PhieuTamTruDTO.Response toResponse(PhieuTamTru phieu) {
        NguoiDung nguoiDung = phieu.getNguoiDung();
        XacThucDanhTinh xacThucDanhTinh = xacThucDanhTinhRepo.findByNguoiDung_MaNguoiDung(nguoiDung.getMaNguoiDung())
                .orElse(null);
        String diaChiTamTru = preferStoredValue(phieu.getDiaChiTamTru());

        LocalDate ngaySinh = phieu.getNgaySinh() != null
                ? phieu.getNgaySinh()
                : xacThucDanhTinh != null ? xacThucDanhTinh.getNgaySinh() : null;

        return PhieuTamTruDTO.Response.builder()
                .maPhieuTamTru(phieu.getMaPhieuTamTru())
                .maNguoiDung(nguoiDung.getMaNguoiDung())
                .coQuanDangKy(preferStoredValue(phieu.getCoQuanDangKy()))
                .hoTen(preferStoredValue(
                        phieu.getHoTen(),
                        xacThucDanhTinh != null ? xacThucDanhTinh.getHoTen() : null,
                        nguoiDung.getHoTen()
                ))
                .gioiTinh(preferStoredValue(phieu.getGioiTinh()))
                .soDienThoai(preferStoredValue(phieu.getSoDienThoai(), nguoiDung.getSoDienThoai()))
                .email(preferStoredValue(phieu.getEmail(), nguoiDung.getEmail()))
                .soCanCuocCongDan(preferStoredValue(phieu.getSoCanCuocCongDan()))
                .ngaySinh(ngaySinh != null ? ngaySinh.toString() : null)
                .diaChiThuongTru(preferStoredValue(
                        phieu.getDiaChiThuongTru(),
                        xacThucDanhTinh != null ? xacThucDanhTinh.getDiaChi() : null
                ))
                .diaChiTamTru(diaChiTamTru)
                .tenChuHo(preferStoredValue(phieu.getTenChuHo()))
                .quanHeVoiChuHo(preferStoredValue(phieu.getQuanHeVoiChuHo()))
                .soDinhDanhChuHo(preferStoredValue(phieu.getSoDinhDanhChuHo()))
                .noiDungDeNghi(preferStoredValue(
                        phieu.getNoiDungDeNghi(),
                        buildNoiDungDeNghi(diaChiTamTru, phieu.getNgayBatDau())
                ))
                .ngayBatDau(phieu.getNgayBatDau() != null ? phieu.getNgayBatDau().toString() : null)
                .build();
    }

    private NguoiDung layNguoiDung(Integer maNguoiDung) {
        return nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));
    }

    private PhieuTamTru layPhieuSoHuu(Integer maPhieu, Integer maNguoiDung, String action) {
        PhieuTamTru phieu = phieuTamTruRepo.findById(maPhieu)
                .orElseThrow(() -> new RuntimeException("Khong tim thay phieu tam tru"));
        if (!Objects.equals(phieu.getNguoiDung().getMaNguoiDung(), maNguoiDung)) {
            throw new RuntimeException("Ban khong co quyen " + action + " phieu nay");
        }
        return phieu;
    }

    private String preferStoredValue(String... values) {
        for (String value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String buildNoiDungDeNghi(String diaChiTamTru, LocalDate ngayBatDau) {
        String noiDangKy = diaChiTamTru == null ? "" : diaChiTamTru.trim();

        String ngayText = formatDate(ngayBatDau);
        if (noiDangKy.isBlank() && ngayText.isBlank()) {
            return "Dang ky tam tru.";
        }
        if (ngayText.isBlank()) {
            return "Dang ky tam tru tai " + noiDangKy + ".";
        }
        if (noiDangKy.isBlank()) {
            return "Dang ky tam tru tu ngay " + ngayText + ".";
        }
        return "Dang ky tam tru tai " + noiDangKy + " tu ngay " + ngayText + ".";
    }

    private String formatDate(LocalDate value) {
        return value == null ? "" : value.format(DATE_FORMAT);
    }

    private String normalizeStoredText(String value, int maxLength, String fieldName) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        String normalized = trimmed.replaceAll("\\s+", " ");
        if (normalized.length() > maxLength) {
            throw new RuntimeException(fieldName + " khong duoc vuot qua " + maxLength + " ky tu");
        }
        return normalized;
    }

    private String normalizePhone(String value, String fieldName) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        return InputValidator.normalizePhone(trimmed, fieldName, false);
    }

    private String normalizeEmail(String value, String fieldName) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        if (!trimmed.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new RuntimeException(fieldName + " khong hop le");
        }

        if (trimmed.length() > 255) {
            throw new RuntimeException(fieldName + " khong duoc vuot qua 255 ky tu");
        }

        return trimmed.toLowerCase(Locale.ROOT);
    }

    private String normalizeCitizenId(String value, String fieldName) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        if (!trimmed.matches("^\\d{9,12}$")) {
            throw new RuntimeException(fieldName + " phai gom tu 9 den 12 chu so");
        }

        return trimmed;
    }

    private String normalizeOptionalName(String value, String fieldName) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }

        return InputValidator.normalizeName(trimmed, fieldName);
    }
}
