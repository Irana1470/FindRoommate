package com.roommate.service;

import com.roommate.dto.AuthDTO;
import com.roommate.model.NguoiDung;
import com.roommate.model.ViTien;
import com.roommate.model.VaiTro;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.ViTienRepository;
import com.roommate.security.JwtUtils;
import com.roommate.util.InputValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final NguoiDungRepository nguoiDungRepo;
    private final ViTienRepository viTienRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Transactional
    public AuthDTO.AuthResponse dangKy(AuthDTO.DangKyRequest req) {
        String hoTen = InputValidator.normalizeName(req.getHoTen(), "Ho ten");
        String email = InputValidator.normalizeEmail(req.getEmail());
        String soDienThoai = InputValidator.normalizePhone(req.getSoDienThoai(), "So dien thoai", true);

        if (nguoiDungRepo.existsByEmail(email)) {
            throw new RuntimeException("Email đã được sử dụng");
        }
        if (nguoiDungRepo.existsBySoDienThoai(soDienThoai)) {
            throw new RuntimeException("Số điện thoại đã được sử dụng");
        }

        NguoiDung nd = NguoiDung.builder()
                .hoTen(hoTen)
                .email(email)
                .soDienThoai(soDienThoai)
                .role(VaiTro.USER)
                .matKhau(passwordEncoder.encode(req.getMatKhau()))
                .build();
        nd = nguoiDungRepo.save(nd);

        viTienRepo.save(ViTien.builder()
                .nguoiDung(nd)
                .tongTien(BigDecimal.ZERO)
                .build());

        String token = jwtUtils.generateToken(email);
        return taoAuthResponse(nd, token);
    }

    @Transactional
    public AuthDTO.AuthResponse dangNhap(AuthDTO.DangNhapRequest req) {
        String email = InputValidator.normalizeEmail(req.getEmail());
        NguoiDung nd = nguoiDungRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (Boolean.TRUE.equals(nd.getTaiKhoanBiKhoa())) {
            throw new RuntimeException(nd.getLyDoKhoaTaiKhoan() != null && !nd.getLyDoKhoaTaiKhoan().isBlank()
                    ? "Tài khoản đã bị khóa: " + nd.getLyDoKhoaTaiKhoan()
                    : "Tài khoản đã bị khóa. Vui lòng liên hệ admin");
        }

        if (!xacThucMatKhau(nd, req.getMatKhau())) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng");
        }

        return taoAuthResponse(nd, jwtUtils.generateToken(nd.getEmail()));
    }

    private AuthDTO.AuthResponse taoAuthResponse(NguoiDung nd, String token) {
        return AuthDTO.AuthResponse.builder()
                .token(token)
                .loaiToken("Bearer")
                .maNguoiDung(nd.getMaNguoiDung())
                .hoTen(nd.getHoTen())
                .email(nd.getEmail())
                .role((nd.getRole() != null ? nd.getRole() : VaiTro.USER).name())
                .xacThuc(nd.getXacThuc())
                .taiKhoanBiKhoa(nd.getTaiKhoanBiKhoa())
                .biHanCheHoatDong(nd.getBiHanCheHoatDong())
                .lyDoHanCheHoatDong(nd.getLyDoHanCheHoatDong())
                .build();
    }

    private boolean xacThucMatKhau(NguoiDung nguoiDung, String rawPassword) {
        String storedPassword = nguoiDung.getMatKhau();
        if (matKhauDaMaHoa(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        if (!storedPassword.equals(rawPassword)) {
            return false;
        }

        nguoiDung.setMatKhau(passwordEncoder.encode(rawPassword));
        nguoiDungRepo.save(nguoiDung);
        return true;
    }

    private boolean matKhauDaMaHoa(String password) {
        return password != null
                && (password.startsWith("$2a$")
                || password.startsWith("$2b$")
                || password.startsWith("$2y$"));
    }
}
