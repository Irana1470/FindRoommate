package com.roommate.config;

import com.roommate.model.NguoiDung;
import com.roommate.model.VaiTro;
import com.roommate.model.ViTien;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.ViTienRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@findroommate";
    private static final String ADMIN_PASSWORD = "admin";
    private static final String ADMIN_PHONE = "0900000000";

    private final NguoiDungRepository nguoiDungRepository;
    private final ViTienRepository viTienRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        NguoiDung admin = nguoiDungRepository.findByEmail(ADMIN_EMAIL)
                .orElseGet(() -> nguoiDungRepository.save(NguoiDung.builder()
                        .hoTen("admin")
                        .email(ADMIN_EMAIL)
                        .soDienThoai(ADMIN_PHONE)
                        .matKhau(passwordEncoder.encode(ADMIN_PASSWORD))
                        .role(VaiTro.ADMIN)
                        .xacThuc(true)
                        .build()));

        boolean changed = false;

        if (admin.getRole() != VaiTro.ADMIN) {
            admin.setRole(VaiTro.ADMIN);
            changed = true;
        }

        if (!Boolean.TRUE.equals(admin.getXacThuc())) {
            admin.setXacThuc(true);
            changed = true;
        }

        if (Boolean.TRUE.equals(admin.getTaiKhoanBiKhoa())) {
            admin.setTaiKhoanBiKhoa(false);
            admin.setLyDoKhoaTaiKhoan(null);
            changed = true;
        }

        if (!passwordEncoder.matches(ADMIN_PASSWORD, admin.getMatKhau())) {
            admin.setMatKhau(passwordEncoder.encode(ADMIN_PASSWORD));
            changed = true;
        }

        if (changed) {
            admin = nguoiDungRepository.save(admin);
        }

        if (viTienRepository.findByNguoiDung_MaNguoiDung(admin.getMaNguoiDung()).isEmpty()) {
            viTienRepository.save(ViTien.builder()
                    .nguoiDung(admin)
                    .tongTien(BigDecimal.ZERO)
                    .build());
        }
    }
}
