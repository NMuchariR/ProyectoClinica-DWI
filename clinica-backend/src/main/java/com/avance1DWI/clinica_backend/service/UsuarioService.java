package com.avance1DWI.clinica_backend.service;

import com.avance1DWI.clinica_backend.dto.*;
import com.avance1DWI.clinica_backend.entity.Usuario;
import com.avance1DWI.clinica_backend.enums.Rol;
import com.avance1DWI.clinica_backend.repository.UsuarioRepository;
import com.avance1DWI.clinica_backend.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse registrar(RegisterRequest request) {
        if (request.getPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("La contraseña no puede exceder 72 bytes UTF-8");
        }

        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new IllegalArgumentException("El correo ya está registrado");
        }

        Usuario nuevo = new Usuario(
                request.getNombre(),
                request.getApellido(),
                request.getCorreo(),
                passwordEncoder.encode(request.getPassword()),
                Rol.PACIENTE
        );

        usuarioRepository.save(nuevo);

        String token = jwtUtil.generarToken(nuevo.getCorreo(), nuevo.getRol().name());
        return new AuthResponse(token, nuevo.getNombre(), nuevo.getApellido(), nuevo.getRol().name());
    }

    public AuthResponse login(LoginRequest request) {
        if (request.getPassword().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BadCredentialsException("Correo o contraseña incorrectos");
        }

        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new BadCredentialsException("Correo o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new BadCredentialsException("Correo o contraseña incorrectos");
        }

        String token = jwtUtil.generarToken(usuario.getCorreo(), usuario.getRol().name());
        return new AuthResponse(token, usuario.getNombre(), usuario.getApellido(), usuario.getRol().name());
    }

    public List<UsuarioResponse> listarUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(u -> new UsuarioResponse(u.getId(), u.getNombre(), u.getApellido(), u.getCorreo(), u.getRol().name()))
                .toList();
    }

    public void eliminarUsuario(Long id) {
        usuarioRepository.deleteById(id);
    }
}