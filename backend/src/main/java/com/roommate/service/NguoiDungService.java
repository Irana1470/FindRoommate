package com.roommate.service;

import com.roommate.dto.NguoiDungDTO;
import com.roommate.model.DanhGia;
import com.roommate.model.GiaoDichVi;
import com.roommate.model.NguoiDung;
import com.roommate.model.VaiTro;
import com.roommate.model.ViTien;
import com.roommate.repository.BaiDangRepository;
import com.roommate.repository.DanhGiaRepository;
import com.roommate.repository.GiaoDichViRepository;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.PhongRepository;
import com.roommate.repository.ViTienRepository;
import com.roommate.repository.XacThucDanhTinhRepository;
import com.roommate.util.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NguoiDungService {

    private final NguoiDungRepository nguoiDungRepo;
    private final ViTienRepository viTienRepo;
    private final GiaoDichViRepository giaoDichViRepo;
    private final DanhGiaRepository danhGiaRepo;
    private final BaiDangRepository baiDangRepo;
    private final PhongRepository phongRepo;
    private final XacThucDanhTinhRepository xacThucDanhTinhRepo;
    private final CloudinaryMediaService cloudinaryMediaService;

    public enum LoaiHanChe {
        DANG_BAI("đăng bài"),
        TAO_PHONG("tạo phòng"),
        GUI_YEU_CAU_PHONG("gửi yêu cầu tham gia phòng");

        private final String moTa;

        LoaiHanChe(String moTa) {
            this.moTa = moTa;
        }

        public String getMoTa() {
            return moTa;
        }
    }

    public NguoiDungDTO.Response layThongTin(Integer maNguoiDung) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        capNhatHetHanHanCheNeuCan(nd);
        var xacThucDanhTinh = xacThucDanhTinhRepo.findByNguoiDung_MaNguoiDung(maNguoiDung).orElse(null);
        Double diem = danhGiaRepo.tinhDiemTrungBinh(maNguoiDung);
        var vi = viTienRepo.findByNguoiDung_MaNguoiDung(maNguoiDung);

        return NguoiDungDTO.Response.builder()
                .maNguoiDung(nd.getMaNguoiDung())
                .hoTen(nd.getHoTen())
                .hoTenXacThuc(xacThucDanhTinh != null ? xacThucDanhTinh.getHoTen() : null)
                .email(nd.getEmail())
                .soDienThoai(nd.getSoDienThoai())
                .avatar(nd.getAvatar())
                .soCanCuocCongDan(null)
                .ngaySinhXacThuc(
                        xacThucDanhTinh != null && xacThucDanhTinh.getNgaySinh() != null
                                ? xacThucDanhTinh.getNgaySinh().toString()
                                : null
                )
                .diaChiThuongTruXacThuc(xacThucDanhTinh != null ? xacThucDanhTinh.getDiaChi() : null)
                .role((nd.getRole() != null ? nd.getRole() : VaiTro.USER).name())
                .xacThuc(nd.getXacThuc())
                .taiKhoanBiKhoa(nd.getTaiKhoanBiKhoa())
                .lyDoKhoaTaiKhoan(nd.getLyDoKhoaTaiKhoan())
                .biHanCheHoatDong(nd.getBiHanCheHoatDong())
                .lyDoHanCheHoatDong(nd.getLyDoHanCheHoatDong())
                .canhBaoTaiKhoan(nd.getCanhBaoTaiKhoan())
                .hanCheDangBai(nd.getHanCheDangBai())
                .hanCheTaoPhong(nd.getHanCheTaoPhong())
                .hanCheGuiYeuCauPhong(nd.getHanCheGuiYeuCauPhong())
                .thoiGianHanCheDen(nd.getThoiGianHanCheDen())
                .ngayTao(nd.getNgayTao())
                .diemDanhGia(diem)
                .soDuVi(vi.map(ViTien::getTongTien).filter(soDu -> soDu != null).orElse(BigDecimal.ZERO))
                .build();
    }

    public NguoiDungDTO.PublicProfileResponse layTrangCaNhanCongKhai(Integer maNguoiDung) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        capNhatHetHanHanCheNeuCan(nd);

        Double diem = danhGiaRepo.tinhDiemTrungBinh(maNguoiDung);
        long tongPhong = phongRepo.countByChuPhong_MaNguoiDung(maNguoiDung);
        long tongBaiDang = baiDangRepo.countByNguoiDang_MaNguoiDung(maNguoiDung);
        List<NguoiDungDTO.PublicReviewResponse> danhGiaNhanDuoc = danhGiaRepo.findReceivedReviews(maNguoiDung)
                .stream()
                .limit(6)
                .map(this::toPublicReviewResponse)
                .toList();

        return NguoiDungDTO.PublicProfileResponse.builder()
                .maNguoiDung(nd.getMaNguoiDung())
                .hoTen(nd.getHoTen())
                .avatar(nd.getAvatar())
                .xacThuc(nd.getXacThuc())
                .ngayTao(nd.getNgayTao())
                .diemDanhGia(diem)
                .tongPhong(tongPhong)
                .tongBaiDang(tongBaiDang)
                .taiKhoanBiKhoa(nd.getTaiKhoanBiKhoa())
                .lyDoKhoaTaiKhoan(nd.getLyDoKhoaTaiKhoan())
                .biHanCheHoatDong(nd.getBiHanCheHoatDong())
                .lyDoHanCheHoatDong(nd.getLyDoHanCheHoatDong())
                .canhBaoTaiKhoan(nd.getCanhBaoTaiKhoan())
                .hanCheDangBai(nd.getHanCheDangBai())
                .hanCheTaoPhong(nd.getHanCheTaoPhong())
                .hanCheGuiYeuCauPhong(nd.getHanCheGuiYeuCauPhong())
                .thoiGianHanCheDen(nd.getThoiGianHanCheDen())
                .danhGiaNhanDuoc(danhGiaNhanDuoc)
                .build();
    }

    public List<NguoiDungDTO.Response> layDanhSachNguoiDungChoAdmin(String keyword) {
        return nguoiDungRepo.timKiemChoAdmin(keyword == null ? null : keyword.trim())
                .stream()
                .map(user -> layThongTin(user.getMaNguoiDung()))
                .toList();
    }

    public List<NguoiDungDTO.GiaoDichViResponse> layLichSuGiaoDichVi(Integer maNguoiDung) {
        return giaoDichViRepo.findByViTien_NguoiDung_MaNguoiDungOrderByNgayTaoDesc(maNguoiDung)
                .stream()
                .map(this::toGiaoDichViResponse)
                .toList();
    }

    @Transactional
    public NguoiDungDTO.Response capNhat(Integer maNguoiDung, NguoiDungDTO.CapNhatRequest req) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        String hoTen = InputValidator.normalizeName(req.getHoTen(), "Họ tên");
        String soDienThoai = InputValidator.normalizePhone(req.getSoDienThoai(), "Số điện thoại", true);

        nguoiDungRepo.findBySoDienThoai(soDienThoai)
                .filter(nguoiDung -> !nguoiDung.getMaNguoiDung().equals(maNguoiDung))
                .ifPresent(nguoiDung -> {
                    throw new RuntimeException("Số điện thoại đã được sử dụng");
                });

        nd.setHoTen(hoTen);
        nd.setSoDienThoai(soDienThoai);

        if (req.getAvatar() != null) {
            nd.setAvatar(req.getAvatar());
        }

        nguoiDungRepo.save(nd);
        return layThongTin(maNguoiDung);
    }

    @Transactional
    public NguoiDungDTO.Response capNhatVaiTro(Integer maNguoiDung, VaiTro vaiTro) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        nd.setRole(vaiTro);
        nguoiDungRepo.save(nd);
        return layThongTin(maNguoiDung);
    }

    @Transactional
    public NguoiDungDTO.Response capNhatTrangThaiKhoaTaiKhoan(
            Integer maNguoiDung,
            Boolean taiKhoanBiKhoa,
            String lyDoKhoaTaiKhoan
    ) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        yeuCauKhongPhaiAdmin(nd);
        nd.setTaiKhoanBiKhoa(Boolean.TRUE.equals(taiKhoanBiKhoa));
        nd.setLyDoKhoaTaiKhoan(Boolean.TRUE.equals(taiKhoanBiKhoa)
                ? InputValidator.normalizeOptionalText(lyDoKhoaTaiKhoan, 255, "Lý do khóa tài khoản")
                : null);
        nguoiDungRepo.save(nd);
        return layThongTin(maNguoiDung);
    }

    @Transactional
    public NguoiDungDTO.Response capNhatHanCheHoatDong(
            Integer maNguoiDung,
            Boolean biHanCheHoatDong,
            String lyDoHanCheHoatDong,
            Boolean hanCheDangBai,
            Boolean hanCheTaoPhong,
            Boolean hanCheGuiYeuCauPhong,
            LocalDateTime thoiGianHanCheDen
    ) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        yeuCauKhongPhaiAdmin(nd);

        boolean restricted = Boolean.TRUE.equals(biHanCheHoatDong);
        if (restricted && thoiGianHanCheDen == null) {
            throw new RuntimeException("Vui lòng nhập thời gian hết hạn hạn chế");
        }
        if (restricted && thoiGianHanCheDen.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Thời gian hết hạn hạn chế phải ở tương lai");
        }

        nd.setBiHanCheHoatDong(restricted);
        nd.setLyDoHanCheHoatDong(restricted
                ? InputValidator.normalizeOptionalText(lyDoHanCheHoatDong, 255, "Lý do hạn chế hoạt động")
                : null);
        nd.setHanCheDangBai(restricted && Boolean.TRUE.equals(hanCheDangBai));
        nd.setHanCheTaoPhong(restricted && Boolean.TRUE.equals(hanCheTaoPhong));
        nd.setHanCheGuiYeuCauPhong(restricted && Boolean.TRUE.equals(hanCheGuiYeuCauPhong));
        nd.setThoiGianHanCheDen(restricted ? thoiGianHanCheDen : null);
        nguoiDungRepo.save(nd);
        return layThongTin(maNguoiDung);
    }

    @Transactional
    public NguoiDungDTO.Response capNhatCanhBaoTaiKhoan(
            Integer maNguoiDung,
            String canhBaoTaiKhoan
    ) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        yeuCauKhongPhaiAdmin(nd);
        nd.setCanhBaoTaiKhoan(InputValidator.normalizeOptionalText(canhBaoTaiKhoan, 255, "Cảnh báo tài khoản"));
        nguoiDungRepo.save(nd);
        return layThongTin(maNguoiDung);
    }

    public void yeuCauTaiKhoanKhongBiHanChe(Integer maNguoiDung, LoaiHanChe loaiHanChe) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        capNhatHetHanHanCheNeuCan(nd);
        if (!Boolean.TRUE.equals(nd.getBiHanCheHoatDong())) {
            return;
        }

        boolean blocked = switch (loaiHanChe) {
            case DANG_BAI -> Boolean.TRUE.equals(nd.getHanCheDangBai());
            case TAO_PHONG -> Boolean.TRUE.equals(nd.getHanCheTaoPhong());
            case GUI_YEU_CAU_PHONG -> Boolean.TRUE.equals(nd.getHanCheGuiYeuCauPhong());
        };
        if (blocked) {
            String lyDo = nd.getLyDoHanCheHoatDong();
            String den = nd.getThoiGianHanCheDen() != null ? " đến " + nd.getThoiGianHanCheDen() : "";
            throw new RuntimeException((lyDo != null && !lyDo.isBlank())
                    ? "Tài khoản đang bị hạn chế " + loaiHanChe.getMoTa() + den + ": " + lyDo
                    : "Tài khoản đang bị hạn chế " + loaiHanChe.getMoTa() + den);
        }
    }

    @Transactional
    public String uploadAvatar(Integer maNguoiDung, MultipartFile file) throws IOException {
        validateImage(file, "avatar");

        String url = cloudinaryMediaService.uploadImage(file, "roommate/avatars");
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        nd.setAvatar(url);
        nguoiDungRepo.save(nd);
        return url;
    }

    private void validateImage(MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn file " + fieldName);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("File " + fieldName + " phải là ảnh");
        }
    }

    public NguoiDung layNguoiDungTheoEmail(String email) {
        return nguoiDungRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    @Transactional
    protected void capNhatHetHanHanCheNeuCan(NguoiDung nguoiDung) {
        if (!Boolean.TRUE.equals(nguoiDung.getBiHanCheHoatDong())) {
            return;
        }
        if (nguoiDung.getThoiGianHanCheDen() == null) {
            return;
        }
        if (nguoiDung.getThoiGianHanCheDen().isAfter(LocalDateTime.now())) {
            return;
        }

        nguoiDung.setBiHanCheHoatDong(false);
        nguoiDung.setLyDoHanCheHoatDong(null);
        nguoiDung.setHanCheDangBai(false);
        nguoiDung.setHanCheTaoPhong(false);
        nguoiDung.setHanCheGuiYeuCauPhong(false);
        nguoiDung.setThoiGianHanCheDen(null);
        nguoiDungRepo.save(nguoiDung);
    }

    private void yeuCauKhongPhaiAdmin(NguoiDung nguoiDung) {
        if (nguoiDung.getRole() == VaiTro.ADMIN) {
            throw new RuntimeException("Không thể quản lý tài khoản quản trị viên trong mục này");
        }
    }

    private NguoiDungDTO.PublicReviewResponse toPublicReviewResponse(DanhGia danhGia) {
        return NguoiDungDTO.PublicReviewResponse.builder()
                .maDanhGia(danhGia.getMaDanhGia())
                .maNguoiDanhGia(danhGia.getNguoiDanhGia().getMaNguoiDung())
                .tenNguoiDanhGia(danhGia.getNguoiDanhGia().getHoTen())
                .avatarNguoiDanhGia(danhGia.getNguoiDanhGia().getAvatar())
                .moTa(danhGia.getMoTa())
                .soSao(danhGia.getSoSao())
                .ngayDanhGia(danhGia.getNgayDanhGia() != null ? danhGia.getNgayDanhGia().toString() : null)
                .build();
    }

    private NguoiDungDTO.GiaoDichViResponse toGiaoDichViResponse(GiaoDichVi giaoDich) {
        return NguoiDungDTO.GiaoDichViResponse.builder()
                .maGiaoDich(giaoDich.getMaGiaoDich())
                .maHoaDon(giaoDich.getHoaDon() != null ? giaoDich.getHoaDon().getMaHoaDon() : null)
                .loai(giaoDich.getLoai())
                .chieu(giaoDich.getChieu())
                .soTien(giaoDich.getSoTien())
                .soDuSauGiaoDich(giaoDich.getSoDuSauGiaoDich())
                .moTa(giaoDich.getMoTa())
                .ngayTao(giaoDich.getNgayTao())
                .build();
    }
}
