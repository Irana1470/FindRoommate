package com.roommate.service;

import com.roommate.dto.YeuCauDTO;
import com.roommate.model.ChiTietPhong;
import com.roommate.model.NguoiDung;
import com.roommate.model.Phong;
import com.roommate.model.YeuCauThamGia;
import com.roommate.repository.ChiTietPhongRepository;
import com.roommate.repository.HoaDonRepository;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.PhongRepository;
import com.roommate.repository.YeuCauThamGiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class YeuCauThamGiaService {

    private final YeuCauThamGiaRepository yeuCauRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final PhongRepository phongRepo;
    private final ChiTietPhongRepository chiTietPhongRepo;
    private final HoaDonRepository hoaDonRepo;
    private final PhongService phongService;
    private final NguoiDungService nguoiDungService;

    @Transactional
    public YeuCauDTO.Response guiYeuCau(Integer maNguoiDung, YeuCauDTO.TaoYeuCauRequest req) {
        nguoiDungService.yeuCauTaiKhoanKhongBiHanChe(maNguoiDung, NguoiDungService.LoaiHanChe.GUI_YEU_CAU_PHONG);
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (!Boolean.TRUE.equals(nd.getXacThuc())) {
            throw new RuntimeException("Cần xác thực danh tính trước khi gửi yêu cầu");
        }

        Phong phong = phongRepo.findById(req.getMaPhong())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));
        String loaiYeuCau = normalizeRequestType(req.getLoaiYeuCau());

        if ("THAM_GIA".equals(loaiYeuCau)) {
            if ("Da day".equals(phong.getTrangThai())) {
                throw new RuntimeException("Phong da day");
            }
            if (yeuCauRepo.findByNguoiDung_MaNguoiDungAndPhong_MaPhongAndLoaiYeuCauAndTrangThai(
                    maNguoiDung, req.getMaPhong(), loaiYeuCau, "Cho duyet").isPresent()) {
                throw new RuntimeException("Bạn đã gửi yêu cầu tham gia cho phòng này rồi");
            }
        } else {
            if (phong.getChuPhong().getMaNguoiDung().equals(maNguoiDung)) {
                throw new RuntimeException("Chủ phòng không thể gửi yêu cầu rời phòng");
            }
            if (!chiTietPhongRepo.existsByPhong_MaPhongAndNguoiDung_MaNguoiDung(req.getMaPhong(), maNguoiDung)) {
                throw new RuntimeException("Ban khong phai thanh vien cua phong nay");
            }
            if (yeuCauRepo.findByNguoiDung_MaNguoiDungAndPhong_MaPhongAndLoaiYeuCauAndTrangThai(
                    maNguoiDung, req.getMaPhong(), loaiYeuCau, "Cho duyet").isPresent()) {
                throw new RuntimeException("Bạn đã gửi yêu cầu rời phòng và đang chờ duyệt");
            }
            if (!hoaDonRepo.findByNguoiDung_MaNguoiDungAndPhong_MaPhongAndTrangThai(
                    maNguoiDung, req.getMaPhong(), "Chua thanh toan").isEmpty()) {
                throw new RuntimeException("Bạn cần thanh toán hết hóa đơn trước khi rời phòng");
            }
        }

        YeuCauThamGia yeuCau = YeuCauThamGia.builder()
                .nguoiDung(nd)
                .phong(phong)
                .moTa(req.getMoTa())
                .loaiYeuCau(loaiYeuCau)
                .trangThai("Cho duyet")
                .build();
        yeuCau = yeuCauRepo.save(yeuCau);
        return toResponse(yeuCau);
    }

    @Transactional
    public YeuCauDTO.Response duyetYeuCau(Integer maYeuCau, Integer maChuPhong, boolean chapNhan) {
        YeuCauThamGia yeuCau = yeuCauRepo.findById(maYeuCau)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));
        Phong phong = yeuCau.getPhong();
        if (!phong.getChuPhong().getMaNguoiDung().equals(maChuPhong)) {
            throw new RuntimeException("Bạn không có quyền duyệt yêu cầu này");
        }
        if (!"Cho duyet".equals(yeuCau.getTrangThai())) {
            throw new RuntimeException("Yeu cau nay da duoc xu ly");
        }

        if (chapNhan) {
            yeuCau.setTrangThai("Chap nhan");
            if ("ROI_PHONG".equals(normalizeRequestType(yeuCau.getLoaiYeuCau()))) {
                if (!hoaDonRepo.findByNguoiDung_MaNguoiDungAndPhong_MaPhongAndTrangThai(
                        yeuCau.getNguoiDung().getMaNguoiDung(),
                        phong.getMaPhong(),
                        "Chua thanh toan"
                ).isEmpty()) {
                    throw new RuntimeException("Thanh vien nay con hoa don chua thanh toan");
                }
                phongService.roiPhong(phong.getMaPhong(), yeuCau.getNguoiDung().getMaNguoiDung());
            } else {
                ChiTietPhong chiTiet = ChiTietPhong.builder()
                        .phong(phong)
                        .nguoiDung(yeuCau.getNguoiDung())
                        .build();
                chiTietPhongRepo.save(chiTiet);
                phong.setSoNguoiHienTai(phong.getSoNguoiHienTai() + 1);
                phongRepo.save(phong);
                phongService.kiemTraVaDongPhong(phong);
            }
        } else {
            yeuCau.setTrangThai("Tu choi");
        }
        return toResponse(yeuCauRepo.save(yeuCau));
    }

    public List<YeuCauDTO.Response> layYeuCauCuaPhong(Integer maPhong, Integer maChuPhong) {
        Phong phong = phongRepo.findById(maPhong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));
        if (!phong.getChuPhong().getMaNguoiDung().equals(maChuPhong)) {
            throw new RuntimeException("Không có quyền xem");
        }
        return yeuCauRepo.findByPhong_MaPhong(maPhong)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<YeuCauDTO.Response> layYeuCauCuaUser(Integer maNguoiDung) {
        return yeuCauRepo.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void huyYeuCau(Integer maYeuCau, Integer maNguoiDung) {
        YeuCauThamGia yeuCau = yeuCauRepo.findById(maYeuCau)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));

        if (!yeuCau.getNguoiDung().getMaNguoiDung().equals(maNguoiDung)) {
            throw new RuntimeException("Bạn không có quyền hủy yêu cầu này");
        }

        if (!"Cho duyet".equals(yeuCau.getTrangThai())) {
            throw new RuntimeException("Chi co the huy yeu cau dang cho duyet");
        }

        yeuCauRepo.delete(yeuCau);
    }

    private YeuCauDTO.Response toResponse(YeuCauThamGia y) {
        return YeuCauDTO.Response.builder()
                .maYeuCau(y.getMaYeuCau())
                .maNguoiDung(y.getNguoiDung().getMaNguoiDung())
                .tenNguoiDung(y.getNguoiDung().getHoTen())
                .avatarNguoiDung(y.getNguoiDung().getAvatar())
                .maPhong(y.getPhong().getMaPhong())
                .tenPhong(y.getPhong().getTitle())
                .ngayYeuCau(y.getNgayYeuCau())
                .moTa(y.getMoTa())
                .loaiYeuCau(normalizeRequestType(y.getLoaiYeuCau()))
                .trangThai(y.getTrangThai())
                .build();
    }

    private String normalizeRequestType(String value) {
        return "ROI_PHONG".equalsIgnoreCase(value) ? "ROI_PHONG" : "THAM_GIA";
    }
}
