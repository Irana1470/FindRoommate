package com.roommate.repository;

import com.roommate.model.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, Integer> {
    Optional<NguoiDung> findByEmail(String email);
    Optional<NguoiDung> findBySoDienThoai(String soDienThoai);
    boolean existsByEmail(String email);
    boolean existsBySoDienThoai(String soDienThoai);
    long countByXacThucTrue();

    @Query("""
            SELECT n FROM NguoiDung n
            WHERE n.role <> com.roommate.model.VaiTro.ADMIN
            AND (:keyword IS NULL OR :keyword = ''
            OR LOWER(n.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR n.soDienThoai LIKE CONCAT('%', :keyword, '%')
            OR LOWER(n.hoTen) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY n.ngayTao DESC
            """)
    List<NguoiDung> timKiemChoAdmin(@Param("keyword") String keyword);

    @Query("""
            SELECT n FROM NguoiDung n
            WHERE n.role <> com.roommate.model.VaiTro.ADMIN
              AND n.maNguoiDung <> :maNguoiDung
              AND (
                  LOWER(n.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                  OR n.soDienThoai LIKE CONCAT('%', :keyword, '%')
              )
            ORDER BY n.hoTen ASC
            """)
    List<NguoiDung> timTheoEmailHoacSoDienThoai(@Param("maNguoiDung") Integer maNguoiDung, @Param("keyword") String keyword);
}
