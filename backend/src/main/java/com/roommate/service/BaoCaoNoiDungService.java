package com.roommate.service;

import com.roommate.model.BaiDang;
import com.roommate.model.BaoCaoNoiDung;
import com.roommate.model.NguoiDung;
import com.roommate.model.Phong;
import com.roommate.repository.BaiDangRepository;
import com.roommate.repository.BaoCaoNoiDungRepository;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.PhongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BaoCaoNoiDungService {

    public static final String LOAI_BAI_DANG = "POST";
    public static final String LOAI_PHONG = "ROOM";
    private static final int MAX_TIEU_DE_DOI_TUONG_LENGTH = 255;

    private final BaoCaoNoiDungRepository baoCaoNoiDungRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final BaiDangRepository baiDangRepository;
    private final PhongRepository phongRepository;

    @Transactional
    public BaoCaoNoiDung baoCaoBaiDang(Integer maNguoiBaoCao, Integer maBaiDang, String lyDo, String chiTiet) {
        NguoiDung nguoiBaoCao = layNguoiDung(maNguoiBaoCao);
        BaiDang baiDang = baiDangRepository.findById(maBaiDang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));
        if (baiDang.getNguoiDang().getMaNguoiDung().equals(maNguoiBaoCao)) {
            throw new RuntimeException("Bạn không thể tự báo cáo bài đăng của chính mình");
        }

        return baoCaoNoiDungRepository.save(BaoCaoNoiDung.builder()
                .nguoiBaoCao(nguoiBaoCao)
                .nguoiBiBaoCao(baiDang.getNguoiDang())
                .loaiDoiTuong(LOAI_BAI_DANG)
                .maDoiTuong(baiDang.getMaBaiDang())
                .tieuDeDoiTuong(chuanHoaTieuDeDoiTuong(firstNonBlank(baiDang.getMoTa(), "Bài đăng #" + baiDang.getMaBaiDang())))
                .lyDo(chuanHoaLyDo(lyDo))
                .chiTiet(chuanHoaChiTiet(chiTiet))
                .trangThai("NEW")
                .build());
    }

    @Transactional
    public BaoCaoNoiDung baoCaoPhong(Integer maNguoiBaoCao, Integer maPhong, String lyDo, String chiTiet) {
        NguoiDung nguoiBaoCao = layNguoiDung(maNguoiBaoCao);
        Phong phong = phongRepository.findById(maPhong)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng"));
        if (phong.getChuPhong().getMaNguoiDung().equals(maNguoiBaoCao)) {
            throw new RuntimeException("Bạn không thể tự báo cáo phòng của chính mình");
        }

        return baoCaoNoiDungRepository.save(BaoCaoNoiDung.builder()
                .nguoiBaoCao(nguoiBaoCao)
                .nguoiBiBaoCao(phong.getChuPhong())
                .loaiDoiTuong(LOAI_PHONG)
                .maDoiTuong(phong.getMaPhong())
                .tieuDeDoiTuong(chuanHoaTieuDeDoiTuong(firstNonBlank(phong.getTitle(), "Phòng #" + phong.getMaPhong())))
                .lyDo(chuanHoaLyDo(lyDo))
                .chiTiet(chuanHoaChiTiet(chiTiet))
                .trangThai("NEW")
                .build());
    }

    public List<BaoCaoNoiDung> layTatCaBaoCao() {
        return baoCaoNoiDungRepository.findAll().stream()
                .sorted(Comparator.comparing(BaoCaoNoiDung::getNgayTao, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Transactional
    public BaoCaoNoiDung capNhatBaoCao(Integer maBaoCao, String trangThai, String ghiChuXuLy) {
        BaoCaoNoiDung baoCao = baoCaoNoiDungRepository.findById(maBaoCao)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo"));
        baoCao.setTrangThai(chuanHoaTrangThai(trangThai));
        baoCao.setGhiChuXuLy(trimToNull(ghiChuXuLy));
        return baoCaoNoiDungRepository.save(baoCao);
    }

    private String chuanHoaLyDo(String lyDo) {
        String value = trimToNull(lyDo);
        if (value == null) {
            throw new RuntimeException("Vui lòng chọn lý do báo cáo");
        }
        if (value.length() > 120) {
            throw new RuntimeException("Lý do báo cáo không được vượt quá 120 ký tự");
        }
        return value;
    }

    private String chuanHoaChiTiet(String chiTiet) {
        String value = trimToNull(chiTiet);
        if (value != null && value.length() > 2000) {
            throw new RuntimeException("Chi tiết báo cáo không được vượt quá 2000 ký tự");
        }
        return value;
    }

    private String chuanHoaTrangThai(String trangThai) {
        String value = trimToNull(trangThai);
        if (value == null) {
            throw new RuntimeException("Trạng thái báo cáo không hợp lệ");
        }
        if (!List.of("NEW", "REVIEWING", "RESOLVED").contains(value)) {
            throw new RuntimeException("Trạng thái báo cáo không hợp lệ");
        }
        return value;
    }

    private NguoiDung layNguoiDung(Integer maNguoiDung) {
        return nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    private String firstNonBlank(String value, String fallback) {
        return value != null && !value.isBlank() ? value.trim() : fallback;
    }

    private String chuanHoaTieuDeDoiTuong(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() <= MAX_TIEU_DE_DOI_TUONG_LENGTH) {
            return trimmed;
        }
        return trimmed.substring(0, MAX_TIEU_DE_DOI_TUONG_LENGTH);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
