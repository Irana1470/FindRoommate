package com.roommate.repository;

import com.roommate.model.DanhGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DanhGiaRepository extends JpaRepository<DanhGia, Integer> {
    List<DanhGia> findByNguoiDanhGia_MaNguoiDung(Integer maNguoiDung);

    @Query(value = "SELECT DISTINCT d.* FROM DanhGia d " +
           "LEFT JOIN HoaDon h ON h.maHoaDon = d.maHoaDon " +
           "LEFT JOIN Phong p ON p.maPhong = h.maPhong " +
           "WHERE d.maNguoiDuocDanhGia = :maNguoiDung " +
           "OR p.maChuPhong = :maNguoiDung " +
           "OR h.maNguoiDung = :maNguoiDung " +
           "ORDER BY d.ngayDanhGia DESC", nativeQuery = true)
    List<DanhGia> findReceivedReviews(@Param("maNguoiDung") Integer maNguoiDung);

    @Query(value = "SELECT AVG(d.soSao) FROM DanhGia d " +
           "LEFT JOIN HoaDon h ON h.maHoaDon = d.maHoaDon " +
           "LEFT JOIN Phong p ON p.maPhong = h.maPhong " +
           "WHERE d.maNguoiDuocDanhGia = :maNguoiDung " +
           "OR p.maChuPhong = :maNguoiDung " +
           "OR h.maNguoiDung = :maNguoiDung", nativeQuery = true)
    Double tinhDiemTrungBinh(@Param("maNguoiDung") Integer maNguoiDung);
}
