package com.roommate.security;

import com.roommate.model.NguoiDung;
import com.roommate.model.VaiTro;
import com.roommate.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final NguoiDungRepository nguoiDungRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        NguoiDung nd = nguoiDungRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay nguoi dung: " + email));
        VaiTro role = nd.getRole() != null ? nd.getRole() : VaiTro.USER;
        return User.builder()
                .username(nd.getEmail())
                .password(nd.getMatKhau())
                .accountLocked(Boolean.TRUE.equals(nd.getTaiKhoanBiKhoa()))
                .roles(role.name())
                .build();
    }
}
