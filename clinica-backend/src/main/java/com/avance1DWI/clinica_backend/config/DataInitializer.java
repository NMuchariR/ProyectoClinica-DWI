package com.avance1DWI.clinica_backend.config;

import com.avance1DWI.clinica_backend.entity.Usuario;
import com.avance1DWI.clinica_backend.enums.Rol;
import com.avance1DWI.clinica_backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminFirstName;
    private final String adminLastName;

    public DataInitializer(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.email:}") String adminEmail,
            @Value("${app.bootstrap-admin.password:}") String adminPassword,
            @Value("${app.bootstrap-admin.first-name:}") String adminFirstName,
            @Value("${app.bootstrap-admin.last-name:}") String adminLastName) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail.trim();
        this.adminPassword = adminPassword;
        this.adminFirstName = adminFirstName.trim();
        this.adminLastName = adminLastName.trim();
    }

    @Override
    public void run(String... args) {
        boolean emailConfigured = !adminEmail.isBlank();
        boolean passwordConfigured = !adminPassword.isBlank();
        boolean nameConfigured = !adminFirstName.isBlank() && !adminLastName.isBlank();

        if (!emailConfigured && !passwordConfigured && adminFirstName.isBlank() && adminLastName.isBlank()) {
            return;
        }

        if (!emailConfigured || !passwordConfigured || !nameConfigured
                || adminPassword.length() < 12
                || adminPassword.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException(
                    "Para crear el administrador inicial, configure BOOTSTRAP_ADMIN_EMAIL, " +
                            "BOOTSTRAP_ADMIN_PASSWORD (12-72 bytes UTF-8), BOOTSTRAP_ADMIN_FIRST_NAME " +
                            "y BOOTSTRAP_ADMIN_LAST_NAME."
            );
        }

        if (usuarioRepository.findByCorreo(adminEmail).isEmpty()) {
            Usuario admin = new Usuario(
                    adminFirstName,
                    adminLastName,
                    adminEmail,
                    passwordEncoder.encode(adminPassword),
                    Rol.ADMINISTRADOR
            );
            usuarioRepository.save(admin);
        }
    }
}