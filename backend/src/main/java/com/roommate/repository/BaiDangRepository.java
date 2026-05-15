package com.roommate.repository;

import com.roommate.model.BaiDang;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface BaiDangRepository extends JpaRepository<BaiDang, Integer> {
    List<BaiDang> findByNguoiDang_MaNguoiDung(Integer maNguoiDung);
    long countByNguoiDang_MaNguoiDung(Integer maNguoiDung);
    Page<BaiDang> findByTrangThai(String trangThai, Pageable pageable);
    long countByTrangThai(String trangThai);

    @Query("SELECT b FROM BaiDang b WHERE b.trangThai = 'Dang' " +
           "AND (:giaTienMin IS NULL OR b.giaTien >= :giaTienMin) " +
           "AND (:giaTienMax IS NULL OR b.giaTien <= :giaTienMax) " +
           "AND (:diaChi IS NULL OR b.diaChi LIKE %:diaChi%) " +
           "AND (:tuKhoa IS NULL OR b.moTa LIKE %:tuKhoa% OR b.noiDung LIKE %:tuKhoa%)")
    Page<BaiDang> timKiemBaiDang(@Param("giaTienMin") BigDecimal giaTienMin,
                                  @Param("giaTienMax") BigDecimal giaTienMax,
                                  @Param("diaChi") String diaChi,
                                  @Param("tuKhoa") String tuKhoa,
                                  Pageable pageable);
}
