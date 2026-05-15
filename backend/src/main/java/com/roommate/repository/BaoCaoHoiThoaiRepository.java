package com.roommate.repository;

import com.roommate.model.BaoCaoHoiThoai;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BaoCaoHoiThoaiRepository extends JpaRepository<BaoCaoHoiThoai, Integer> {

    @Override
    @EntityGraph(attributePaths = {"nguoiBaoCao", "nguoiBiBaoCao"})
    List<BaoCaoHoiThoai> findAll();
}
