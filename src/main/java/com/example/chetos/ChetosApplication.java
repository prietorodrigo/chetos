package com.example.chetos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(exclude={SecurityAutoConfiguration.class})
@ComponentScan("com.example.chetos")
public class ChetosApplication {

	public static void main(String[] args) {
		SpringApplication.run(ChetosApplication.class, args);
	}

}
