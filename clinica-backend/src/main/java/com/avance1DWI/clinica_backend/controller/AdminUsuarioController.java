package com.avance1DWI.clinica_backend.controller;

import com.avance1DWI.clinica_backend.dto.UsuarioRequest;
import com.avance1DWI.clinica_backend.exception.RecursoNoEncontradoException;
import com.avance1DWI.clinica_backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/usuarios")
public class AdminUsuarioController {

    private final UsuarioService usuarioService;

    public AdminUsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(Authentication authentication,
                                        @PathVariable Long id,
                                        @Valid @RequestBody UsuarioRequest request) {
        try {
            return ResponseEntity.ok(usuarioService.actualizarUsuario(id, request, authentication.getName()));
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(Authentication authentication, @PathVariable Long id) {
        try {
            usuarioService.eliminarUsuario(id, authentication.getName());
            return ResponseEntity.ok("Usuario eliminado correctamente");
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}