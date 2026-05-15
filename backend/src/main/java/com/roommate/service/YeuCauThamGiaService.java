package com.roommate.service;

import com.roommate.dto.YeuCauDTO;
import com.roommate.model.*;
import com.roommate.repository.*;
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
    private final PhongService phongService;

    @Transactional
    public YeuCauDTO.Response guiYeuCau(Integer maNguoiDung, YeuCauDTO.TaoYeuCauRequest req) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (!nd.getXacThuc())
            throw new RuntimeException("Cần xác thực danh tính trước khi tham gia phòng");

        Phong phong = phongRepo.findById(req.getMaPhong())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));
        if ("Da day".equals(phong.getTrangThai()))
            throw new RuntimeException("Phòng đã đầy");

        if (yeuCauRepo.findByNguoiDung_MaNguoiDungAndPhong_MaPhong(maNguoiDung, req.getMaPhong()).isPresent())
            throw new RuntimeException("Bạn đã gửi yêu cầu cho phòng này rồi");

        YeuCauThamGia yeuCau = YeuCauThamGia.builder()
                .nguoiDung(nd).phong(phong)
                .moTa(req.getMoTa()).trangThai("Cho duyet")
                .build();
        yeuCau = yeuCauRepo.save(yeuCau);
        return toResponse(yeuCau);
    }

    @Transactional
    public YeuCauDTO.Response duyetYeuCau(Integer maYeuCau, Integer maChuPhong, boolean chapNhan) {
        YeuCauThamGia yeuCau = yeuCauRepo.findById(maYeuCau)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));
        Phong phong = yeuCau.getPhong();
        if (!phong.getChuPhong().getMaNguoiDung().equals(maChuPhong))
            throw new RuntimeException("Bạn không có quyền duyệt yêu cầu này");

        if (chapNhan) {
            yeuCau.setTrangThai("Chap nhan");
            // Add member to room
            ChiTietPhong chiTiet = ChiTietPhong.builder()
                    .phong(phong).nguoiDung(yeuCau.getNguoiDung()).build();
            chiTietPhongRepo.save(chiTiet);
            // Update member count
            phong.setSoNguoiHienTai(phong.getSoNguoiHienTai() + 1);
            phongRepository(phong);
            // Auto-close room if full
            phongService.kiemTraVaDongPhong(phong);
        } else {
            yeuCau.setTrangThai("Tu choi");
        }
        return toResponse(yeuCauRepo.save(yeuCau));
    }

    private void phongRepository(Phong phong) {
        phongRepo.save(phong);
    }

    public List<YeuCauDTO.Response> layYeuCauCuaPhong(Integer maPhong, Integer maChuPhong) {
        Phong phong = phongRepo.findById(maPhong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));
        if (!phong.getChuPhong().getMaNguoiDung().equals(maChuPhong))
            throw new RuntimeException("Không có quyền xem");
        return yeuCauRepo.findByPhong_MaPhong(maPhong)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<YeuCauDTO.Response> layYeuCauCuaUser(Integer maNguoiDung) {
        return yeuCauRepo.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void huyYeuCau(Integer maYeuCau, Integer maNguoiDung) {
        YeuCauThamGia yeuCau = yeuCauRepo.findById(maYeuCau)
                .orElseThrow(() -> new RuntimeException("Khong tim thay yeu cau"));

        if (!yeuCau.getNguoiDung().getMaNguoiDung().equals(maNguoiDung)) {
            throw new RuntimeException("Ban khong co quyen huy yeu cau nay");
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
                .moTa(y.getMoTa()).trangThai(y.getTrangThai())
                .build();
    }
}
