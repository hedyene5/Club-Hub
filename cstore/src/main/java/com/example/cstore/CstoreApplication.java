package com.example.cstore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class CstoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(CstoreApplication.class, args);
    }

}