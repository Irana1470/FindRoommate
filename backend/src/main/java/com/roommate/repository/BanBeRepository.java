package com.roommate.repository;

import com.roommate.model.BanBe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BanBeRepository extends JpaRepository<BanBe, Integer> {

    @Query("""
            SELECT b FROM BanBe b
            WHERE (b.nguoiGui.maNguoiDung = :userA AND b.nguoiNhan.maNguoiDung = :userB)
               OR (b.nguoiGui.maNguoiDung = :userB AND b.nguoiNhan.maNguoiDung = :userA)
            """)
    Optional<BanBe> timQuanHeGiuaHaiNguoi(@Param("userA") Integer userA, @Param("userB") Integer userB);

    List<BanBe> findByNguoiNhan_MaNguoiDungAndTrangThaiOrderByNgayTaoDesc(Integer maNguoiDung, String trangThai);

    List<BanBe> findByNguoiGui_MaNguoiDungAndTrangThaiOrderByNgayTaoDesc(Integer maNguoiDung, String trangThai);

    @Query("""
            SELECT b FROM BanBe b
            WHERE b.trangThai = 'ACCEPTED'
              AND (b.nguoiGui.maNguoiDung = :maNguoiDung OR b.nguoiNhan.maNguoiDung = :maNguoiDung)
            ORDER BY b.ngayCapNhat DESC
            """)
    List<BanBe> timDanhSachBanBe(@Param("maNguoiDung") Integer maNguoiDung);
}
