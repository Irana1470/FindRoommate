package com.roommate.service;

import com.roommate.dto.DanhGiaDTO;
import com.roommate.model.DanhGia;
import com.roommate.model.HoaDon;
import com.roommate.model.NguoiDung;
import com.roommate.repository.DanhGiaRepository;
import com.roommate.repository.HoaDonRepository;
import com.roommate.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DanhGiaService {

    private final DanhGiaRepository danhGiaRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final HoaDonRepository hoaDonRepo;

    @Transactional
    public DanhGiaDTO.Response taoDanhGia(Integer maNguoiDung, DanhGiaDTO.TaoDanhGiaRequest req) {
        NguoiDung nguoiDanhGia = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));

        if (req.getMaHoaDon() == null && req.getMaNguoiDuocDanhGia() == null) {
            throw new RuntimeException("Can chon hoa don hoac nguoi dung de danh gia");
        }

        HoaDon hoaDon = null;
        NguoiDung nguoiDuocDanhGia = null;

        if (req.getMaHoaDon() != null) {
            hoaDon = hoaDonRepo.findById(req.getMaHoaDon())
                    .orElseThrow(() -> new RuntimeException("Khong tim thay hoa don"));
            if (!"Da thanh toan".equals(hoaDon.getTrangThai())) {
                throw new RuntimeException("Chi co the danh gia sau khi thanh toan");
            }
        }

        if (req.getMaNguoiDuocDanhGia() != null) {
            nguoiDuocDanhGia = nguoiDungRepo.findById(req.getMaNguoiDuocDanhGia())
                    .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung duoc danh gia"));
        } else if (hoaDon != null) {
            Integer maNguoiThue = hoaDon.getNguoiDung().getMaNguoiDung();
            Integer maChuPhong = hoaDon.getPhong().getChuPhong().getMaNguoiDung();

            if (Objects.equals(maNguoiDung, maNguoiThue)) {
                nguoiDuocDanhGia = hoaDon.getPhong().getChuPhong();
            } else if (Objects.equals(maNguoiDung, maChuPhong)) {
                nguoiDuocDanhGia = hoaDon.getNguoiDung();
            } else {
                throw new RuntimeException("Ban khong co quyen danh gia hoa don nay");
            }
        }

        if (nguoiDuocDanhGia != null && nguoiDuocDanhGia.getMaNguoiDung().equals(maNguoiDung)) {
            throw new RuntimeException("Khong the tu danh gia chinh minh");
        }

        DanhGia danhGia = DanhGia.builder()
                .nguoiDanhGia(nguoiDanhGia)
                .hoaDon(hoaDon)
                .nguoiDuocDanhGia(nguoiDuocDanhGia)
                .moTa(req.getMoTa())
                .soSao(req.getSoSao())
                .build();

        return toResponse(danhGiaRepo.save(danhGia));
    }

    public List<DanhGiaDTO.Response> layDanhGiaCuaUser(Integer maNguoiDung) {
        return danhGiaRepo.findByNguoiDanhGia_MaNguoiDung(maNguoiDung)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DanhGiaDTO.Response> layDanhGiaNhanDuoc(Integer maNguoiDung) {
        return danhGiaRepo.findReceivedReviews(maNguoiDung)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private DanhGiaDTO.Response toResponse(DanhGia danhGia) {
        return DanhGiaDTO.Response.builder()
                .maDanhGia(danhGia.getMaDanhGia())
                .maNguoiDanhGia(danhGia.getNguoiDanhGia().getMaNguoiDung())
                .tenNguoiDanhGia(danhGia.getNguoiDanhGia().getHoTen())
                .avatar(danhGia.getNguoiDanhGia().getAvatar())
                .maHoaDon(danhGia.getHoaDon() != null ? danhGia.getHoaDon().getMaHoaDon() : null)
                .maNguoiDuocDanhGia(danhGia.getNguoiDuocDanhGia() != null ? danhGia.getNguoiDuocDanhGia().getMaNguoiDung() : null)
                .moTa(danhGia.getMoTa())
                .soSao(danhGia.getSoSao())
                .ngayDanhGia(danhGia.getNgayDanhGia() != null ? danhGia.getNgayDanhGia().toString() : null)
                .build();
    }
}
