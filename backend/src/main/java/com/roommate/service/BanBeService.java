package com.roommate.service;

import com.roommate.dto.BanBeDTO;
import com.roommate.model.BanBe;
import com.roommate.model.NguoiDung;
import com.roommate.model.VaiTro;
import com.roommate.repository.BanBeRepository;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.util.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BanBeService {

    private final BanBeRepository banBeRepo;
    private final NguoiDungRepository nguoiDungRepo;

    @Transactional
    public BanBeDTO.QuanHeBanBeResponse guiLoiMoi(Integer maNguoiGui, Integer maNguoiNhan) {
        if (maNguoiGui.equals(maNguoiNhan)) {
            throw new RuntimeException("Không thể kết bạn với chính mình");
        }

        NguoiDung nguoiGui = layNguoiDungThuong(maNguoiGui);
        NguoiDung nguoiNhan = layNguoiDungThuong(maNguoiNhan);

        BanBe quanHe = banBeRepo.timQuanHeGiuaHaiNguoi(maNguoiGui, maNguoiNhan).orElse(null);
        if (quanHe != null) {
            if ("ACCEPTED".equals(quanHe.getTrangThai())) {
                throw new RuntimeException("Hai người đã là bạn bè");
            }
            if ("PENDING".equals(quanHe.getTrangThai())) {
                throw new RuntimeException("Đã tồn tại lời mời kết bạn đang chờ xử lý");
            }
        }

        BanBe moiQuanHe = BanBe.builder()
                .nguoiGui(nguoiGui)
                .nguoiNhan(nguoiNhan)
                .trangThai("PENDING")
                .build();

        return toQuanHeResponse(banBeRepo.save(moiQuanHe), maNguoiGui);
    }

    @Transactional
    public BanBeDTO.QuanHeBanBeResponse phanHoiLoiMoi(Integer maBanBe, Integer maNguoiNhan, Boolean chapNhan) {
        BanBe quanHe = banBeRepo.findById(maBanBe)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời kết bạn"));

        if (!quanHe.getNguoiNhan().getMaNguoiDung().equals(maNguoiNhan)) {
            throw new RuntimeException("Bạn không có quyền xử lý lời mời này");
        }
        if (!"PENDING".equals(quanHe.getTrangThai())) {
            throw new RuntimeException("Lời mời này đã được xử lý");
        }

        quanHe.setTrangThai(Boolean.TRUE.equals(chapNhan) ? "ACCEPTED" : "REJECTED");
        return toQuanHeResponse(banBeRepo.save(quanHe), maNguoiNhan);
    }

    @Transactional
    public void xoaQuanHeBanBe(Integer maBanBe, Integer maNguoiDung) {
        BanBe quanHe = banBeRepo.findById(maBanBe)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quan hệ bạn bè"));

        boolean coQuyen = quanHe.getNguoiGui().getMaNguoiDung().equals(maNguoiDung)
                || quanHe.getNguoiNhan().getMaNguoiDung().equals(maNguoiDung);
        if (!coQuyen) {
            throw new RuntimeException("Bạn không có quyền xóa quan hệ này");
        }

        banBeRepo.delete(quanHe);
    }

    public BanBeDTO.DanhSachBanBeResponse layDanhSachBanBe(Integer maNguoiDung) {
        List<BanBeDTO.NguoiDungTomTat> banBe = banBeRepo.timDanhSachBanBe(maNguoiDung)
                .stream()
                .map(item -> item.getNguoiGui().getMaNguoiDung().equals(maNguoiDung)
                        ? toNguoiDungTomTat(item.getNguoiNhan())
                        : toNguoiDungTomTat(item.getNguoiGui()))
                .toList();

        List<BanBeDTO.QuanHeBanBeResponse> loiMoiDaNhan = banBeRepo
                .findByNguoiNhan_MaNguoiDungAndTrangThaiOrderByNgayTaoDesc(maNguoiDung, "PENDING")
                .stream()
                .map(item -> toQuanHeResponse(item, maNguoiDung))
                .toList();

        List<BanBeDTO.QuanHeBanBeResponse> loiMoiDaGui = banBeRepo
                .findByNguoiGui_MaNguoiDungAndTrangThaiOrderByNgayTaoDesc(maNguoiDung, "PENDING")
                .stream()
                .map(item -> toQuanHeResponse(item, maNguoiDung))
                .toList();

        return BanBeDTO.DanhSachBanBeResponse.builder()
                .banBe(banBe)
                .loiMoiDaNhan(loiMoiDaNhan)
                .loiMoiDaGui(loiMoiDaGui)
                .build();
    }

    public List<BanBeDTO.NguoiDungTomTat> timNguoiDungTheoLienHe(Integer maNguoiDung, String keyword) {
        String normalizedKeyword = InputValidator.normalizeOptionalText(keyword, 100, "Từ khóa");
        if (normalizedKeyword == null || normalizedKeyword.isBlank()) {
            return List.of();
        }

        return nguoiDungRepo.timTheoEmailHoacSoDienThoai(maNguoiDung, normalizedKeyword.trim())
                .stream()
                .map(this::toNguoiDungTomTat)
                .toList();
    }

    public BanBeDTO.QuanHeBanBeResponse layTrangThaiBanBe(Integer maNguoiDung, Integer maNguoiDungKhac) {
        if (maNguoiDung.equals(maNguoiDungKhac)) {
            return BanBeDTO.QuanHeBanBeResponse.builder()
                    .trangThai("SELF")
                    .laBanBe(false)
                    .coTheChapNhan(false)
                    .build();
        }

        return banBeRepo.timQuanHeGiuaHaiNguoi(maNguoiDung, maNguoiDungKhac)
                .map(item -> toQuanHeResponse(item, maNguoiDung))
                .orElse(BanBeDTO.QuanHeBanBeResponse.builder()
                        .trangThai("NONE")
                        .laBanBe(false)
                        .coTheChapNhan(false)
                        .build());
    }

    public List<BanBeDTO.NguoiDungTomTat> layBanBeDaChapNhan(Integer maNguoiDung) {
        return banBeRepo.timDanhSachBanBe(maNguoiDung)
                .stream()
                .map(item -> item.getNguoiGui().getMaNguoiDung().equals(maNguoiDung)
                        ? toNguoiDungTomTat(item.getNguoiNhan())
                        : toNguoiDungTomTat(item.getNguoiGui()))
                .toList();
    }

    public boolean laBanBe(Integer maNguoiDungA, Integer maNguoiDungB) {
        return banBeRepo.timQuanHeGiuaHaiNguoi(maNguoiDungA, maNguoiDungB)
                .map(item -> "ACCEPTED".equals(item.getTrangThai()))
                .orElse(false);
    }

    private NguoiDung layNguoiDungThuong(Integer maNguoiDung) {
        NguoiDung nguoiDung = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        if (nguoiDung.getRole() == VaiTro.ADMIN) {
            throw new RuntimeException("Không thể thực hiện chức năng này với tài khoản quản trị viên");
        }
        return nguoiDung;
    }

    private BanBeDTO.QuanHeBanBeResponse toQuanHeResponse(BanBe quanHe, Integer maNguoiDung) {
        return BanBeDTO.QuanHeBanBeResponse.builder()
                .maBanBe(quanHe.getMaBanBe())
                .trangThai(quanHe.getTrangThai())
                .laBanBe("ACCEPTED".equals(quanHe.getTrangThai()))
                .coTheChapNhan(
                        "PENDING".equals(quanHe.getTrangThai())
                                && quanHe.getNguoiNhan().getMaNguoiDung().equals(maNguoiDung)
                )
                .nguoiGui(toNguoiDungTomTat(quanHe.getNguoiGui()))
                .nguoiNhan(toNguoiDungTomTat(quanHe.getNguoiNhan()))
                .ngayTao(quanHe.getNgayTao())
                .ngayCapNhat(quanHe.getNgayCapNhat())
                .build();
    }

    private BanBeDTO.NguoiDungTomTat toNguoiDungTomTat(NguoiDung nguoiDung) {
        return BanBeDTO.NguoiDungTomTat.builder()
                .maNguoiDung(nguoiDung.getMaNguoiDung())
                .hoTen(nguoiDung.getHoTen())
                .email(nguoiDung.getEmail())
                .soDienThoai(nguoiDung.getSoDienThoai())
                .avatar(nguoiDung.getAvatar())
                .build();
    }
}
