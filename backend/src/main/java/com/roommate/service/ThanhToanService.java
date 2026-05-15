package com.roommate.service;

import com.roommate.dto.HoaDonDTO;
import com.roommate.model.*;
import com.roommate.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThanhToanService {

    private final HoaDonRepository hoaDonRepo;
    private final ChiTietHoaDonRepository chiTietHoaDonRepo;
    private final GiaoDichViRepository giaoDichViRepo;
    private final ViTienRepository viTienRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final PhongRepository phongRepo;
    private final DichVuRepository dichVuRepo;
    private final ChiTietPhongRepository chiTietPhongRepo;

    @Transactional
    public BigDecimal napTien(Integer maNguoiDung, BigDecimal soTien) {
        if (soTien.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("So tien phai lon hon 0");
        }

        ViTien vi = viTienRepo.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Khong tim thay vi"));
        vi.setTongTien(vi.getTongTien().add(soTien));
        viTienRepo.save(vi);
        luuGiaoDichVi(vi, null, "NAP_TIEN", "IN", soTien, "Nap tien vao vi");
        return vi.getTongTien();
    }

    @Transactional
    public HoaDonDTO.Response taoHoaDon(Integer maNguoiDung, HoaDonDTO.TaoHoaDonRequest req) {
        NguoiDung nguoiDung = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));
        Phong phong = phongRepo.findById(req.getMaPhong())
                .orElseThrow(() -> new RuntimeException("Khong tim thay phong"));

        HoaDon hoaDon = HoaDon.builder()
                .nguoiDung(nguoiDung)
                .phong(phong)
                .moTa(req.getMoTa())
                .trangThai("Chua thanh toan")
                .build();
        hoaDon = hoaDonRepo.save(hoaDon);

        BigDecimal tong = BigDecimal.ZERO;
        if (req.getChiTiet() != null) {
            for (HoaDonDTO.ChiTietRequest chiTiet : req.getChiTiet()) {
                DichVu dichVu = dichVuRepo.findById(chiTiet.getMaDichVu())
                        .orElseThrow(() -> new RuntimeException("Khong tim thay dich vu"));
                BigDecimal thanhTien = dichVu.getGiaTien().multiply(BigDecimal.valueOf(chiTiet.getSoLuong()));
                ChiTietHoaDon chiTietHoaDon = ChiTietHoaDon.builder()
                        .hoaDon(hoaDon)
                        .dichVu(dichVu)
                        .soLuongSuDung(chiTiet.getSoLuong())
                        .thanhTien(thanhTien)
                        .build();
                chiTietHoaDonRepo.save(chiTietHoaDon);
                tong = tong.add(thanhTien);
            }
        }

        if (tong.compareTo(BigDecimal.ZERO) == 0 && phong.getGiaTien() != null) {
            tong = phong.getGiaTien();
        }

        hoaDon.setTongTien(tong);
        hoaDon.setTienPhong(tong);
        hoaDon.setTienDichVu(BigDecimal.ZERO);
        hoaDon.setTienDien(BigDecimal.ZERO);
        hoaDon.setTienNuoc(BigDecimal.ZERO);
        hoaDonRepo.save(hoaDon);
        return toResponse(hoaDon);
    }

    @Transactional
    public HoaDonDTO.Response thanhToan(Integer maHoaDon, Integer maNguoiDung) {
        HoaDon hoaDon = hoaDonRepo.findById(maHoaDon)
                .orElseThrow(() -> new RuntimeException("Khong tim thay hoa don"));
        if (!"Chua thanh toan".equals(hoaDon.getTrangThai())) {
            throw new RuntimeException("Hoa don da duoc thanh toan");
        }

        ViTien viNguoiThue = viTienRepo.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Khong tim thay vi nguoi thue"));
        if (viNguoiThue.getTongTien().compareTo(hoaDon.getTongTien()) < 0) {
            throw new RuntimeException("So du vi khong du");
        }

        ViTien viChuPhong = viTienRepo.findByNguoiDung_MaNguoiDung(hoaDon.getPhong().getChuPhong().getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Khong tim thay vi chu phong"));

        viNguoiThue.setTongTien(viNguoiThue.getTongTien().subtract(hoaDon.getTongTien()));
        viChuPhong.setTongTien(viChuPhong.getTongTien().add(hoaDon.getTongTien()));
        viTienRepo.save(viNguoiThue);
        viTienRepo.save(viChuPhong);

        hoaDon.setTrangThai("Da thanh toan");
        hoaDon.setPhuongThucThanhToan("Vi dien tu");
        hoaDon.setNgayThanhToan(java.time.LocalDateTime.now());
        HoaDon savedHoaDon = hoaDonRepo.save(hoaDon);
        luuGiaoDichVi(
                viNguoiThue,
                savedHoaDon,
                "THANH_TOAN_HOA_DON",
                "OUT",
                hoaDon.getTongTien(),
                "Thanh toan hoa don #" + hoaDon.getMaHoaDon() + " cho phong " + hoaDon.getPhong().getTitle()
        );
        luuGiaoDichVi(
                viChuPhong,
                savedHoaDon,
                "NHAN_TIEN_HOA_DON",
                "IN",
                hoaDon.getTongTien(),
                hoaDon.getNguoiDung().getHoTen() + " da thanh toan hoa don #" + hoaDon.getMaHoaDon()
        );
        return toResponse(savedHoaDon);
    }

    @Transactional
    public List<HoaDonDTO.Response> chiaTienPhong(Integer maPhong, Integer maNguoiTao) {
        Phong phong = xacThucChuPhong(maPhong, maNguoiTao);
        List<ChiTietPhong> members = layThanhVienPhong(maPhong);

        BigDecimal tongChiPhi = safeMoney(phong.getGiaTien())
                .add(safeMoney(phong.getTienDichVu()))
                .add(safeMoney(phong.getTienDien()))
                .add(safeMoney(phong.getTienNuoc()));

        return taoHoaDonChiaDeu(
                members,
                phong,
                tongChiPhi,
                "Chia tu dong: tong chi phi = tien phong + dien + nuoc + dich vu, thang " + java.time.LocalDate.now().getMonthValue(),
                safeMoney(phong.getGiaTien()),
                safeMoney(phong.getTienDichVu()),
                safeMoney(phong.getTienDien()),
                safeMoney(phong.getTienNuoc()),
                phong.getTienDien(),
                null,
                "fixed".equalsIgnoreCase(phong.getKieuTinhTienNuoc()) ? null : phong.getTienNuoc(),
                null,
                normalizeWaterBillingMode(phong.getKieuTinhTienNuoc())
        );
    }

    @Transactional
    public List<HoaDonDTO.Response> chiaTienThuCong(Integer maPhong, Integer maNguoiTao, HoaDonDTO.ChiaTienThuCongRequest req) {
        Phong phong = xacThucChuPhong(maPhong, maNguoiTao);
        List<ChiTietPhong> members = layThanhVienPhong(maPhong);

        BigDecimal tongChiPhi = safeMoney(req.getTienPhong())
                .add(safeMoney(req.getTienDichVu()))
                .add(safeMoney(req.getTienDien()))
                .add(safeMoney(req.getTienNuoc()));

        String moTa = (req.getMoTa() != null && !req.getMoTa().isBlank())
                ? req.getMoTa().trim()
                : "Chia thu cong: tien phong + dien + nuoc + dich vu";

        return taoHoaDonChiaDeu(
                members,
                phong,
                tongChiPhi,
                moTa,
                safeMoney(req.getTienPhong()),
                safeMoney(req.getTienDichVu()),
                safeMoney(req.getTienDien()),
                safeMoney(req.getTienNuoc()),
                req.getGiaDien(),
                req.getSoDien(),
                req.getGiaNuoc(),
                req.getSoNuoc(),
                normalizeWaterBillingMode(req.getKieuTinhTienNuoc() != null ? req.getKieuTinhTienNuoc() : phong.getKieuTinhTienNuoc())
        );
    }

    public List<HoaDonDTO.Response> layHoaDonCuaUser(Integer maNguoiDung) {
        return hoaDonRepo.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .stream()
                .filter(hoaDon -> !Boolean.TRUE.equals(hoaDon.getDaAnKhoiNguoiThue()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void xoaHoaDonDaThanhToan(Integer maHoaDon, Integer maNguoiDung) {
        HoaDon hoaDon = hoaDonRepo.findById(maHoaDon)
                .orElseThrow(() -> new RuntimeException("Khong tim thay hoa don"));
        if (!hoaDon.getNguoiDung().getMaNguoiDung().equals(maNguoiDung)) {
            throw new RuntimeException("Ban khong co quyen xoa hoa don nay");
        }
        if (!"Da thanh toan".equals(hoaDon.getTrangThai())) {
            throw new RuntimeException("Chi co the xoa hoa don da thanh toan");
        }
        hoaDon.setDaAnKhoiNguoiThue(true);
        hoaDonRepo.save(hoaDon);
    }

    public List<HoaDonDTO.Response> layHoaDonPhongCuaChuPhong(Integer maNguoiDung) {
        return hoaDonRepo.findByPhong_ChuPhong_MaNguoiDung(maNguoiDung)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BigDecimal xemSoDu(Integer maNguoiDung) {
        return viTienRepo.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .map(ViTien::getTongTien)
                .orElse(BigDecimal.ZERO);
    }

    private Phong xacThucChuPhong(Integer maPhong, Integer maNguoiTao) {
        Phong phong = phongRepo.findById(maPhong)
                .orElseThrow(() -> new RuntimeException("Khong tim thay phong"));
        if (!phong.getChuPhong().getMaNguoiDung().equals(maNguoiTao)) {
            throw new RuntimeException("Ban khong co quyen chia tien cho phong nay");
        }
        return phong;
    }

    private List<ChiTietPhong> layThanhVienPhong(Integer maPhong) {
        List<ChiTietPhong> members = chiTietPhongRepo.findByPhong_MaPhong(maPhong);
        if (members.isEmpty()) {
            throw new RuntimeException("Phong khong co thanh vien");
        }
        return members;
    }

    private List<HoaDonDTO.Response> taoHoaDonChiaDeu(
            List<ChiTietPhong> members,
            Phong phong,
            BigDecimal tongChiPhi,
            String moTa
    ) {
        return taoHoaDonChiaDeu(members, phong, tongChiPhi, moTa, null, null, null, null, null, null, null, null, null);
    }

    private List<HoaDonDTO.Response> taoHoaDonChiaDeu(
            List<ChiTietPhong> members,
            Phong phong,
            BigDecimal tongChiPhi,
            String moTa,
            BigDecimal tongTienPhong,
            BigDecimal tongTienDichVu,
            BigDecimal tongTienDien,
            BigDecimal tongTienNuoc,
            BigDecimal giaDien,
            BigDecimal soDien,
            BigDecimal giaNuoc,
            BigDecimal soNuoc,
            String kieuTinhTienNuoc
    ) {
        BigDecimal tienMoiNguoi = tongChiPhi.divide(BigDecimal.valueOf(members.size()), 2, RoundingMode.HALF_UP);
        BigDecimal tienPhongMoiNguoi = splitComponent(tongTienPhong, members.size());
        BigDecimal tienDichVuMoiNguoi = splitComponent(tongTienDichVu, members.size());
        BigDecimal tienDienMoiNguoi = splitComponent(tongTienDien, members.size());
        BigDecimal tienNuocMoiNguoi = splitComponent(tongTienNuoc, members.size());

        return members.stream().map(member -> {
            HoaDon hoaDon = HoaDon.builder()
                    .nguoiDung(member.getNguoiDung())
                    .phong(phong)
                    .tongTien(tienMoiNguoi)
                    .tienPhong(tienPhongMoiNguoi)
                    .tienDichVu(tienDichVuMoiNguoi)
                    .tienDien(tienDienMoiNguoi)
                    .tienNuoc(tienNuocMoiNguoi)
                    .giaDien(giaDien)
                    .soDien(soDien)
                    .giaNuoc(giaNuoc)
                    .soNuoc(soNuoc)
                    .kieuTinhTienNuoc(kieuTinhTienNuoc)
                    .moTa(moTa)
                    .trangThai("Chua thanh toan")
                    .build();
            return toResponse(hoaDonRepo.save(hoaDon));
        }).collect(Collectors.toList());
    }

    private HoaDonDTO.Response toResponse(HoaDon hoaDon) {
        List<HoaDonDTO.ChiTietItem> chiTiet = new ArrayList<>();
        if (safeMoney(hoaDon.getTienPhong()).compareTo(BigDecimal.ZERO) > 0) {
            chiTiet.add(HoaDonDTO.ChiTietItem.builder()
                    .tenDichVu("Tiền phòng")
                    .soLuong(1)
                    .donGia(safeMoney(hoaDon.getTienPhong()))
                    .thanhTien(safeMoney(hoaDon.getTienPhong()))
                    .build());
        }
        if (safeMoney(hoaDon.getTienDien()).compareTo(BigDecimal.ZERO) > 0) {
            chiTiet.add(HoaDonDTO.ChiTietItem.builder()
                    .tenDichVu("Tiền điện")
                    .donGia(hoaDon.getGiaDien())
                    .thanhTien(safeMoney(hoaDon.getTienDien()))
                    .build());
        }
        if (safeMoney(hoaDon.getTienNuoc()).compareTo(BigDecimal.ZERO) > 0) {
            chiTiet.add(HoaDonDTO.ChiTietItem.builder()
                    .tenDichVu("Tiền nước")
                    .donGia(hoaDon.getGiaNuoc())
                    .thanhTien(safeMoney(hoaDon.getTienNuoc()))
                    .build());
        }
        if (safeMoney(hoaDon.getTienDichVu()).compareTo(BigDecimal.ZERO) > 0) {
            chiTiet.add(HoaDonDTO.ChiTietItem.builder()
                    .tenDichVu("Dịch vụ")
                    .soLuong(1)
                    .donGia(safeMoney(hoaDon.getTienDichVu()))
                    .thanhTien(safeMoney(hoaDon.getTienDichVu()))
                    .build());
        }
        if (hoaDon.getChiTietHoaDons() != null) {
            hoaDon.getChiTietHoaDons().forEach(item -> chiTiet.add(HoaDonDTO.ChiTietItem.builder()
                    .tenDichVu(item.getDichVu() != null ? item.getDichVu().getTenDichVu() : "Dịch vụ")
                    .soLuong(item.getSoLuongSuDung())
                    .donGia(item.getDichVu() != null ? item.getDichVu().getGiaTien() : item.getThanhTien())
                    .thanhTien(item.getThanhTien())
                    .build()));
        }
        return HoaDonDTO.Response.builder()
                .maHoaDon(hoaDon.getMaHoaDon())
                .maNguoiDung(hoaDon.getNguoiDung().getMaNguoiDung())
                .tenNguoiDung(hoaDon.getNguoiDung().getHoTen())
                .maPhong(hoaDon.getPhong().getMaPhong())
                .tenPhong(hoaDon.getPhong().getTitle())
                .tongTien(hoaDon.getTongTien())
                .tienPhong(safeMoney(hoaDon.getTienPhong()))
                .tienDichVu(safeMoney(hoaDon.getTienDichVu()))
                .tienDien(safeMoney(hoaDon.getTienDien()))
                .tienNuoc(safeMoney(hoaDon.getTienNuoc()))
                .giaDien(hoaDon.getGiaDien())
                .soDien(hoaDon.getSoDien())
                .giaNuoc(hoaDon.getGiaNuoc())
                .soNuoc(hoaDon.getSoNuoc())
                .kieuTinhTienNuoc(normalizeWaterBillingMode(hoaDon.getKieuTinhTienNuoc()))
                .phuongThucThanhToan(hoaDon.getPhuongThucThanhToan())
                .moTa(hoaDon.getMoTa())
                .ngayTao(hoaDon.getNgayTao())
                .ngayThanhToan(hoaDon.getNgayThanhToan())
                .trangThai(hoaDon.getTrangThai())
                .chiTiet(chiTiet)
                .build();
    }

    private BigDecimal safeMoney(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal splitComponent(BigDecimal total, int members) {
        if (total == null) {
            return BigDecimal.ZERO;
        }
        return total.divide(BigDecimal.valueOf(members), 2, RoundingMode.HALF_UP);
    }

    private String normalizeWaterBillingMode(String value) {
        return "fixed".equalsIgnoreCase(value) ? "fixed" : "meter";
    }

    private void luuGiaoDichVi(
            ViTien viTien,
            HoaDon hoaDon,
            String loai,
            String chieu,
            BigDecimal soTien,
            String moTa
    ) {
        giaoDichViRepo.save(GiaoDichVi.builder()
                .viTien(viTien)
                .hoaDon(hoaDon)
                .loai(loai)
                .chieu(chieu)
                .soTien(soTien)
                .soDuSauGiaoDich(viTien.getTongTien())
                .moTa(moTa)
                .build());
    }
}
