package com.avance1DWI.clinica_backend;

import com.avance1DWI.clinica_backend.entity.Usuario;
import com.avance1DWI.clinica_backend.enums.Rol;
import com.avance1DWI.clinica_backend.repository.UsuarioRepository;
import com.avance1DWI.clinica_backend.security.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ClinicaBackendApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @AfterEach
    void limpiarUsuarios() {
        usuarioRepository.deleteAll();
    }

    @Test
    void contextLoads() {
    }

    @Test
    void repositoryTreatsSqlInjectionPayloadAsLiteralEmail() {
        usuarioRepository.saveAndFlush(new Usuario(
                "Admin",
                "Test",
                "admin@clinica.com",
                passwordEncoder.encode("un-password-de-prueba"),
                Rol.ADMINISTRADOR
        ));

        assertThat(usuarioRepository.findByCorreo("' OR '1'='1 --")).isEmpty();
    }

    @Test
    void loginRejectsSqlInjectionPayloadAsInvalidEmail() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"correo":"' OR '1'='1 --","password":"password-de-prueba"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patientCannotAccessAdminEndpoints() throws Exception {
        String email = "paciente@clinica.com";
        usuarioRepository.saveAndFlush(new Usuario(
                "Paciente",
                "Prueba",
                email,
                passwordEncoder.encode("contrasena-larga-de-prueba"),
                Rol.PACIENTE
        ));
        String token = jwtUtil.generarToken(email, Rol.PACIENTE.name());

        mockMvc.perform(get("/api/admin/usuarios")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void registrationRejectsShortPassword() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"Paciente","apellido":"Prueba","correo":"nuevo@clinica.com","password":"corta"}
                                """))
                .andExpect(status().isBadRequest());
    }
}
