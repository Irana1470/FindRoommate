package com.roommate.util;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;

/**
 * Utility class for testing the MySQL database connection.
 * Run the main method from the IDE when you want to check local DB access.
 */
public class DatabaseConnectionTester {

    private static final String URL = System.getenv().getOrDefault(
            "DB_URL",
            "jdbc:mysql://localhost:3306/FindRoomMate?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh&createDatabaseIfNotExist=true"
    );
    private static final String USERNAME = System.getenv().getOrDefault("DB_USERNAME", "root");
    private static final String PASSWORD = System.getenv().getOrDefault("DB_PASSWORD", "");
    private static final String DRIVER = "com.mysql.cj.jdbc.Driver";

    public static void main(String[] args) {
        System.out.println("Testing database connection - FindRoomMate");
        System.out.println("URL: " + URL);
        System.out.println("Username: " + USERNAME);
        System.out.println("Driver: " + DRIVER);
        System.out.println();

        testDatabaseConnection();
    }

    public static void testDatabaseConnection() {
        try (Connection connection = DriverManager.getConnection(URL, USERNAME, PASSWORD)) {
            Class.forName(DRIVER);
            System.out.println("MySQL driver loaded successfully.");
            System.out.println("Database connected successfully.");

            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("Product Name: " + metaData.getDatabaseProductName());
            System.out.println("Version: " + metaData.getDatabaseProductVersion());
            System.out.println("JDBC Driver: " + metaData.getDriverName());
            System.out.println("Driver Version: " + metaData.getDriverVersion());
        } catch (ClassNotFoundException e) {
            System.out.println("MySQL driver was not found.");
            System.out.println("Check pom.xml for dependency com.mysql:mysql-connector-j.");
            e.printStackTrace();
        } catch (Exception e) {
            System.out.println("Database connection failed.");
            System.out.println("Error type: " + e.getClass().getSimpleName());
            System.out.println("Details: " + e.getMessage());
            System.out.println();
            System.out.println("Hints:");
            System.out.println("1. Check MySQL is running on localhost:3306.");
            System.out.println("2. Create database FindRoomMate or keep createDatabaseIfNotExist=true.");
            System.out.println("3. Set DB_USERNAME and DB_PASSWORD if your MySQL account is not root with blank password.");
            e.printStackTrace();
        }
    }
}
