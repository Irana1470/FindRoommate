package com.roommate.repository;

import com.roommate.model.ChiTietPhong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChiTietPhongRepository extends JpaRepository<ChiTietPhong, ChiTietPhong.ChiTietPhongId> {
    List<ChiTietPhong> findByPhong_MaPhong(Integer maPhong);
    List<ChiTietPhong> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);
    boolean existsByPhong_MaPhongAndNguoiDung_MaNguoiDung(Integer maPhong, Integer maNguoiDung);
    void deleteByPhong_MaPhongAndNguoiDung_MaNguoiDung(Integer maPhong, Integer maNguoiDung);
}
