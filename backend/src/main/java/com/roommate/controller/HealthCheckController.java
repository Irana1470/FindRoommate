package com.roommate.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthCheckController {

    @Autowired
    private DataSource dataSource;

    /**
     * Kiểm tra kết nối database
     * @return Trạng thái kết nối database
     */
    @GetMapping("/database")
    public ResponseEntity<?> checkDatabaseConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Thử lấy connection từ DataSource
            try (Connection connection = dataSource.getConnection()) {
                if (connection != null && !connection.isClosed()) {
                    // Kiểm tra metadata
                    String databaseProductName = connection.getMetaData().getDatabaseProductName();
                    String databaseVersion = connection.getMetaData().getDatabaseProductVersion();
                    
                    response.put("status", "SUCCESS");
                    response.put("message", "Kết nối database thành công");
                    response.put("database", databaseProductName);
                    response.put("version", databaseVersion);
                    response.put("timestamp", System.currentTimeMillis());
                    
                    return ResponseEntity.ok(response);
                }
            }
        } catch (Exception e) {
            response.put("status", "FAILED");
            response.put("message", "Lỗi kết nối database: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
        
        return ResponseEntity.status(500).body(response);
    }

    /**
     * Kiểm tra trạng thái ứng dụng
     * @return Trạng thái ứng dụng
     */
    @GetMapping
    public ResponseEntity<?> checkHealth() {
        return checkApplicationStatus();
    }

    @GetMapping("/status")
    public ResponseEntity<?> checkApplicationStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("application", "RoommateApp");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
}
