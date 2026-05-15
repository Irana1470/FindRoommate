package com.roommate.service;

import com.roommate.dto.ThongKeDTO;
import com.roommate.repository.BaiDangRepository;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.PhongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ThongKeService {

    private final NguoiDungRepository nguoiDungRepository;
    private final PhongRepository phongRepository;
    private final BaiDangRepository baiDangRepository;

    public ThongKeDTO.TrangChuResponse layThongKeTrangChu() {
        return ThongKeDTO.TrangChuResponse.builder()
                .tongNguoiDung(nguoiDungRepository.count())
                .tongPhongSanSang(phongRepository.countByTrangThai("San sang"))
                .tongBaiDangDangHienThi(baiDangRepository.countByTrangThai("Dang"))
                .tongTaiKhoanXacThuc(nguoiDungRepository.countByXacThucTrue())
                .build();
    }
}
