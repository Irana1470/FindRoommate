package com.roommate.repository;

import com.roommate.model.PhieuTamTru;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhieuTamTruRepository extends JpaRepository<PhieuTamTru, Integer> {
    List<PhieuTamTru> findByNguoiDung_MaNguoiDungOrderByMaPhieuTamTruDesc(Integer maNguoiDung);

    List<PhieuTamTru> findByPhong_MaPhong(Integer maPhong);
}
