package com.roommate.repository;

import com.roommate.model.YeuCauThamGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface YeuCauThamGiaRepository extends JpaRepository<YeuCauThamGia, Integer> {
    List<YeuCauThamGia> findByPhong_MaPhong(Integer maPhong);
    List<YeuCauThamGia> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);
    List<YeuCauThamGia> findByPhong_MaPhongAndTrangThai(Integer maPhong, String trangThai);
    Optional<YeuCauThamGia> findByNguoiDung_MaNguoiDungAndPhong_MaPhong(Integer maNguoiDung, Integer maPhong);
}
