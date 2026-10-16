package com.avance1DWI.clinica_backend.service;

import com.avance1DWI.clinica_backend.dto.*;
import com.avance1DWI.clinica_backend.entity.Usuario;
import com.avance1DWI.clinica_backend.enums.Rol;
import com.avance1DWI.clinica_backend.exception.RecursoNoEncontradoException;
import com.avance1DWI.clinica_backend.repository.UsuarioRepository;
import com.avance1DWI.clinica_backend.security.JwtUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new RuntimeException("El correo ya está registrado");
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
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new RuntimeException("Correo o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new RuntimeException("Correo o contraseña incorrectos");
        }

        String token = jwtUtil.generarToken(usuario.getCorreo(), usuario.getRol().name());
        return new AuthResponse(token, usuario.getNombre(), usuario.getApellido(), usuario.getRol().name());
    }

    public List<UsuarioResponse> listarUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(this::convertirAResponse)
                .toList();
    }

    public UsuarioResponse actualizarUsuario(Long id, UsuarioRequest request, String correoActual) {
        Usuario usuario = buscarEntidad(id);

        boolean esElMismo = usuario.getCorreo().equals(correoActual);
        if (esElMismo && request.getRol() != usuario.getRol()) {
            throw new RuntimeException("No puedes cambiar tu propio rol");
        }

        usuario.setNombre(request.getNombre().trim());
        usuario.setApellido(request.getApellido().trim());
        usuario.setRol(request.getRol());

        return convertirAResponse(usuarioRepository.save(usuario));
    }

    public void eliminarUsuario(Long id, String correoActual) {
        Usuario usuario = buscarEntidad(id);

        if (usuario.getCorreo().equals(correoActual)) {
            throw new RuntimeException("No puedes eliminar tu propia cuenta");
        }

        try {
            usuarioRepository.delete(usuario);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("No se puede eliminar el usuario porque tiene reservas registradas");
        }
    }

    private Usuario buscarEntidad(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }

    private UsuarioResponse convertirAResponse(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getApellido(), u.getCorreo(), u.getRol().name());
    }
}