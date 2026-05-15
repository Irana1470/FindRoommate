package com.roommate.repository;

import com.roommate.model.XacThucDanhTinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface XacThucDanhTinhRepository extends JpaRepository<XacThucDanhTinh, Integer> {
    Optional<XacThucDanhTinh> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);
    Optional<XacThucDanhTinh> findBySoCanCuocCongDanHash(String soCanCuocCongDanHash);
}
