package com.roommate.service;

import com.roommate.dto.PhongDTO;
import com.roommate.model.ChiTietPhong;
import com.roommate.model.NguoiDung;
import com.roommate.model.PhieuTamTru;
import com.roommate.model.Phong;
import com.roommate.repository.ChiTietPhongRepository;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.PhieuTamTruRepository;
import com.roommate.repository.PhongRepository;
import com.roommate.util.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class PhongService {

    private final PhongRepository phongRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final ChiTietPhongRepository chiTietPhongRepo;
    private final PhieuTamTruRepository phieuTamTruRepo;

    @Transactional
    public PhongDTO.Response taoPhong(Integer maChuPhong, PhongDTO.TaoPhongRequest req) {
        NguoiDung chuPhong = nguoiDungRepo.findById(maChuPhong)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));
        if (!Boolean.TRUE.equals(chuPhong.getXacThuc())) {
            throw new RuntimeException("Can xac thuc danh tinh truoc khi dang phong");
        }

        Phong phong = Phong.builder()
                .chuPhong(chuPhong)
                .title(req.getTitle())
                .giaTien(req.getGiaTien())
                .tienDichVu(defaultMoney(req.getTienDichVu()))
                .tienDien(defaultMoney(req.getTienDien()))
                .tienNuoc(defaultMoney(req.getTienNuoc()))
                .soNguoiToiDa(req.getSoNguoiToiDa())
                .soNguoiHienTai(0)
                .tinhThanh(InputValidator.normalizeOptionalText(req.getTinhThanh(), 150, "Tinh thanh"))
                .quanHuyen(InputValidator.normalizeOptionalText(req.getQuanHuyen(), 150, "Quan huyen"))
                .diaChi(InputValidator.normalizeOptionalText(req.getDiaChi(), 255, "Dia chi"))
                .moTa(req.getMoTa())
                .trangThai("San sang")
                .build();

        if (req.getMaPhongCha() != null) {
            Phong phongCha = phongRepo.findById(req.getMaPhongCha())
                    .orElseThrow(() -> new RuntimeException("Khong tim thay phong cha"));
            phong.setPhongCha(phongCha);
        }

        phong = phongRepo.save(phong);
        return toResponse(phong);
    }

    public PhongDTO.Response layChiTiet(Integer maPhong) {
        Phong phong = phongRepo.findById(maPhong)
                .orElseThrow(() -> new RuntimeException("Khong tim thay phong"));
        return toResponse(phong);
    }

    public List<PhongDTO.Response> timKiem(PhongDTO.BoDLocRequest req) {
        return phongRepo.timPhongVoiBoDLoc(
                        req.getGiaTienMin(),
                        req.getGiaTienMax(),
                        req.getTinhThanh(),
                        req.getQuanHuyen(),
                        req.getDiaChi(),
                        req.getSoNguoi()
                ).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PhongDTO.Response> layPhongCuaUser(Integer maNguoiDung) {
        return phongRepo.findByChuPhong_MaNguoiDung(maNguoiDung)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PhongDTO.Response> layPhongThamGia(Integer maNguoiDung) {
        return phongRepo.findPhongThamGia(maNguoiDung)
                .stream()
                .filter(phong -> !phong.getChuPhong().getMaNguoiDung().equals(maNguoiDung))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PhongDTO.Response capNhat(Integer maPhong, Integer maNguoiDung, PhongDTO.CapNhatPhongRequest req) {
        Phong phong = phongRepo.findById(maPhong)
                .orElseThrow(() -> new RuntimeException("Khong tim thay phong"));
        if (!phong.getChuPhong().getMaNguoiDung().equals(maNguoiDung)) {
            throw new RuntimeException("Ban khong co quyen chinh sua phong nay");
        }

        if (req.getTitle() != null) {
            phong.setTitle(req.getTitle());
        }
        if (req.getGiaTien() != null) {
            phong.setGiaTien(req.getGiaTien());
        }
        if (req.getTienDichVu() != null) {
            phong.setTienDichVu(defaultMoney(req.getTienDichVu()));
        }
        if (req.getTienDien() != null) {
            phong.setTienDien(defaultMoney(req.getTienDien()));
        }
        if (req.getTienNuoc() != null) {
            phong.setTienNuoc(defaultMoney(req.getTienNuoc()));
        }
        if (req.getSoNguoiToiDa() != null) {
            phong.setSoNguoiToiDa(req.getSoNguoiToiDa());
        }
        if (req.getTinhThanh() != null) {
            phong.setTinhThanh(InputValidator.normalizeOptionalText(req.getTinhThanh(), 150, "Tinh thanh"));
        }
        if (req.getQuanHuyen() != null) {
            phong.setQuanHuyen(InputValidator.normalizeOptionalText(req.getQuanHuyen(), 150, "Quan huyen"));
        }
        if (req.getDiaChi() != null) {
            phong.setDiaChi(InputValidator.normalizeOptionalText(req.getDiaChi(), 255, "Dia chi"));
        }
        if (req.getMoTa() != null) {
            phong.setMoTa(req.getMoTa());
        }
        if (req.getTrangThai() != null) {
            phong.setTrangThai(req.getTrangThai());
        }

        return toResponse(phongRepo.save(phong));
    }

    @Transactional
    public void xoaPhong(Integer maPhong, Integer maNguoiDung) {
        Phong phong = phongRepo.findById(maPhong)
                .orElseThrow(() -> new RuntimeException("Khong tim thay phong"));
        if (!phong.getChuPhong().getMaNguoiDung().equals(maNguoiDung)) {
            throw new RuntimeException("Ban khong co quyen xoa phong nay");
        }

        List<PhieuTamTru> phieuTamTrus = phieuTamTruRepo.findByPhong_MaPhong(maPhong);
        phieuTamTrus.forEach(phieu -> phieu.setPhong(null));
        if (!phieuTamTrus.isEmpty()) {
            phieuTamTruRepo.saveAll(phieuTamTrus);
        }

        try {
            phongRepo.delete(phong);
            phongRepo.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new RuntimeException(
                    "Khong the xoa phong nay vi van con du lieu lien quan. Hay xu ly bai dang, yeu cau, thanh vien va hoa don truoc."
            );
        }
    }

    @Transactional
    public void kiemTraVaDongPhong(Phong phong) {
        if (phong.getSoNguoiHienTai() >= phong.getSoNguoiToiDa()) {
            phong.setTrangThai("Da day");
            phongRepo.save(phong);
        }
    }

    @Transactional
    public void xoaThanhVien(Integer maPhong, Integer maChuPhong, Integer maThanhVien) {
        Phong phong = phongRepo.findById(maPhong)
                .orElseThrow(() -> new RuntimeException("Khong tim thay phong"));
        if (!phong.getChuPhong().getMaNguoiDung().equals(maChuPhong)) {
            throw new RuntimeException("Ban khong co quyen quan ly phong nay");
        }
        if (phong.getChuPhong().getMaNguoiDung().equals(maThanhVien)) {
            throw new RuntimeException("Khong the xoa chu phong khoi phong");
        }
        if (!chiTietPhongRepo.existsByPhong_MaPhongAndNguoiDung_MaNguoiDung(maPhong, maThanhVien)) {
            throw new RuntimeException("Thanh vien khong ton tai trong phong");
        }

        chiTietPhongRepo.deleteByPhong_MaPhongAndNguoiDung_MaNguoiDung(maPhong, maThanhVien);

        List<PhieuTamTru> phieuTamTrus = phieuTamTruRepo.findByPhong_MaPhong(maPhong)
                .stream()
                .filter(phieu -> phieu.getNguoiDung() != null && phieu.getNguoiDung().getMaNguoiDung().equals(maThanhVien))
                .collect(Collectors.toList());
        phieuTamTrus.forEach(phieu -> phieu.setPhong(null));
        if (!phieuTamTrus.isEmpty()) {
            phieuTamTruRepo.saveAll(phieuTamTrus);
        }

        phong.setSoNguoiHienTai(Math.max((phong.getSoNguoiHienTai() != null ? phong.getSoNguoiHienTai() : 0) - 1, 0));
        if ("Da day".equals(phong.getTrangThai())) {
            phong.setTrangThai("San sang");
        }
        phongRepo.save(phong);
    }

    public Phong layPhong(Integer maPhong) {
        return phongRepo.findById(maPhong)
                .orElseThrow(() -> new RuntimeException("Khong tim thay phong"));
    }

    private PhongDTO.Response toResponse(Phong phong) {
        List<ChiTietPhong> members = chiTietPhongRepo.findByPhong_MaPhong(phong.getMaPhong());
        List<PhongDTO.ThanhVienDTO> memberDTOs = members.stream()
                .map(member -> PhongDTO.ThanhVienDTO.builder()
                        .maNguoiDung(member.getNguoiDung().getMaNguoiDung())
                        .hoTen(member.getNguoiDung().getHoTen())
                        .avatar(member.getNguoiDung().getAvatar())
                        .ngayThamGia(member.getNgayThamGia() != null ? member.getNgayThamGia().toString() : null)
                        .build())
                .collect(Collectors.toList());

        return PhongDTO.Response.builder()
                .maPhong(phong.getMaPhong())
                .maChuPhong(phong.getChuPhong().getMaNguoiDung())
                .tenChuPhong(phong.getChuPhong().getHoTen())
                .avatarChuPhong(phong.getChuPhong().getAvatar())
                .maPhongCha(phong.getPhongCha() != null ? phong.getPhongCha().getMaPhong() : null)
                .title(phong.getTitle())
                .giaTien(phong.getGiaTien())
                .tienDichVu(defaultMoney(phong.getTienDichVu()))
                .tienDien(defaultMoney(phong.getTienDien()))
                .tienNuoc(defaultMoney(phong.getTienNuoc()))
                .soNguoiToiDa(phong.getSoNguoiToiDa())
                .soNguoiHienTai(phong.getSoNguoiHienTai())
                .tinhThanh(phong.getTinhThanh())
                .quanHuyen(phong.getQuanHuyen())
                .diaChi(phong.getDiaChi())
                .diaChiDayDu(buildFullAddress(phong))
                .moTa(phong.getMoTa())
                .trangThai(phong.getTrangThai())
                .danhSachThanhVien(memberDTOs)
                .build();
    }

    private String buildFullAddress(Phong phong) {
        return Stream.of(phong.getDiaChi(), phong.getQuanHuyen(), phong.getTinhThanh())
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(", "));
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
