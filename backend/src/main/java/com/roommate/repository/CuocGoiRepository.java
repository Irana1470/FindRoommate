package com.roommate.repository;

import com.roommate.model.CuocGoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CuocGoiRepository extends JpaRepository<CuocGoi, Integer> {
    Optional<CuocGoi> findByCallId(String callId);
}
