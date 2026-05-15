package com.roommate.repository;

import com.roommate.model.Phong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PhongRepository extends JpaRepository<Phong, Integer> {
    List<Phong> findByChuPhong_MaNguoiDung(Integer maNguoiDung);
    long countByChuPhong_MaNguoiDung(Integer maNguoiDung);
    List<Phong> findByTrangThai(String trangThai);
    long countByTrangThai(String trangThai);
    List<Phong> findByPhongChaIsNull();

    @Query("SELECT p FROM Phong p WHERE p.trangThai = 'San sang' " +
           "AND (:giaTienMin IS NULL OR p.giaTien >= :giaTienMin) " +
           "AND (:giaTienMax IS NULL OR p.giaTien <= :giaTienMax) " +
           "AND (:tinhThanh IS NULL OR p.tinhThanh = :tinhThanh) " +
           "AND (:quanHuyen IS NULL OR p.quanHuyen = :quanHuyen) " +
           "AND (:diaChi IS NULL OR p.diaChi LIKE %:diaChi%) " +
           "AND (:soNguoi IS NULL OR p.soNguoiToiDa >= :soNguoi)")
    List<Phong> timPhongVoiBoDLoc(@Param("giaTienMin") BigDecimal giaTienMin,
                                  @Param("giaTienMax") BigDecimal giaTienMax,
                                  @Param("tinhThanh") String tinhThanh,
                                  @Param("quanHuyen") String quanHuyen,
                                  @Param("diaChi") String diaChi,
                                  @Param("soNguoi") Integer soNguoi);

    List<Phong> findByPhongCha_MaPhong(Integer maPhongCha);

    @Query("SELECT DISTINCT c.phong FROM ChiTietPhong c WHERE c.nguoiDung.maNguoiDung = :maNguoiDung")
    List<Phong> findPhongThamGia(@Param("maNguoiDung") Integer maNguoiDung);
}
