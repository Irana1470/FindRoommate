package com.roommate.repository;

import com.roommate.model.ViTien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ViTienRepository extends JpaRepository<ViTien, Integer> {
    Optional<ViTien> findByNguoiDung_MaNguoiDung(Integer maNguoiDung);
}
