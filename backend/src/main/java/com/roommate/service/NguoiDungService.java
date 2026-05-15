package com.roommate.service;

import com.roommate.dto.NguoiDungDTO;
import com.roommate.model.DanhGia;
import com.roommate.model.GiaoDichVi;
import com.roommate.model.NguoiDung;
import com.roommate.model.VaiTro;
import com.roommate.model.ViTien;
import com.roommate.repository.BaiDangRepository;
import com.roommate.repository.DanhGiaRepository;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.PhongRepository;
import com.roommate.repository.GiaoDichViRepository;
import com.roommate.repository.ViTienRepository;
import com.roommate.repository.XacThucDanhTinhRepository;
import com.roommate.util.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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

    @Value("${app.upload.dir:uploads}")
    private String uploadRootDir;

    public NguoiDungDTO.Response layThongTin(Integer maNguoiDung) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        var xacThucDanhTinh = xacThucDanhTinhRepo.findByNguoiDung_MaNguoiDung(maNguoiDung).orElse(null);
        Double diem = danhGiaRepo.tinhDiemTrungBinh(maNguoiDung);
        var vi = viTienRepo.findByNguoiDung_MaNguoiDung(maNguoiDung);
        return NguoiDungDTO.Response.builder()
                .maNguoiDung(nd.getMaNguoiDung())
                .hoTen(nd.getHoTen())
                .hoTenXacThuc(xacThucDanhTinh != null ? xacThucDanhTinh.getHoTen() : null)
                .email(nd.getEmail())
                .soDienThoai(nd.getSoDienThoai()).avatar(nd.getAvatar())
                .soCanCuocCongDan(null)
                .ngaySinhXacThuc(
                        xacThucDanhTinh != null && xacThucDanhTinh.getNgaySinh() != null
                                ? xacThucDanhTinh.getNgaySinh().toString()
                                : null
                )
                .diaChiThuongTruXacThuc(xacThucDanhTinh != null ? xacThucDanhTinh.getDiaChi() : null)
                .role((nd.getRole() != null ? nd.getRole() : VaiTro.USER).name())
                .xacThuc(nd.getXacThuc()).ngayTao(nd.getNgayTao())
                .taiKhoanBiKhoa(nd.getTaiKhoanBiKhoa())
                .lyDoKhoaTaiKhoan(nd.getLyDoKhoaTaiKhoan())
                .diemDanhGia(diem)
                .soDuVi(vi.map(ViTien::getTongTien).filter(soDu -> soDu != null).orElse(BigDecimal.ZERO))
                .build();
    }

    public NguoiDungDTO.PublicProfileResponse layTrangCaNhanCongKhai(Integer maNguoiDung) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Double diem = danhGiaRepo.tinhDiemTrungBinh(maNguoiDung);
        long tongPhong = phongRepo.countByChuPhong_MaNguoiDung(maNguoiDung);
        long tongBaiDang = baiDangRepo.countByNguoiDang_MaNguoiDung(maNguoiDung);
        List<NguoiDungDTO.PublicReviewResponse> danhGiaNhanDuoc =
                danhGiaRepo.findReceivedReviews(maNguoiDung)
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
                .danhGiaNhanDuoc(danhGiaNhanDuoc)
                .build();
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
    public NguoiDungDTO.Response capNhatTrangThaiKhoaTaiKhoan(Integer maNguoiDung, Boolean taiKhoanBiKhoa, String lyDoKhoaTaiKhoan) {
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        nd.setTaiKhoanBiKhoa(Boolean.TRUE.equals(taiKhoanBiKhoa));
        nd.setLyDoKhoaTaiKhoan(Boolean.TRUE.equals(taiKhoanBiKhoa)
                ? InputValidator.normalizeOptionalText(lyDoKhoaTaiKhoan, 255, "Ly do khoa tai khoan")
                : null);
        nguoiDungRepo.save(nd);
        return layThongTin(maNguoiDung);
    }

    @Transactional
    public String uploadAvatar(Integer maNguoiDung, MultipartFile file) throws IOException {
        validateImage(file, "avatar");

        Path uploadDir = Paths.get(uploadRootDir, "avatars").toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);

        String filename = "avatar_" + maNguoiDung + "_" + System.currentTimeMillis()
                + getExt(file.getOriginalFilename());
        Path path = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

        String url = "/uploads/avatars/" + filename;
        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        nd.setAvatar(url);
        nguoiDungRepo.save(nd);
        return url;
    }

    private void validateImage(MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui long chon file " + fieldName);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("File " + fieldName + " phai la anh");
        }
    }

    private String getExt(String filename) {
        if (filename == null) {
            return ".jpg";
        }

        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : ".jpg";
    }

    public NguoiDung layNguoiDungTheoEmail(String email) {
        return nguoiDungRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
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
