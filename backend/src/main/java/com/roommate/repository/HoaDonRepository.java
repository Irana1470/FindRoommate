package com.roommate.repository;

import com.roommate.model.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, Integer> {
    List<HoaDon> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);
    List<HoaDon> findByPhong_MaPhong(Integer maPhong);
    List<HoaDon> findByTrangThai(String trangThai);
    List<HoaDon> findByPhong_MaPhongAndTrangThai(Integer maPhong, String trangThai);

    @Query("SELECT h FROM HoaDon h WHERE h.phong.chuPhong.maNguoiDung = :maNguoiDung")
    List<HoaDon> findByPhong_ChuPhong_MaNguoiDung(@Param("maNguoiDung") Integer maNguoiDung);
}
