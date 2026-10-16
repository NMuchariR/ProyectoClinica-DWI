package com.avance1DWI.clinica_backend.repository;

import com.avance1DWI.clinica_backend.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCorreo(String correo);

    boolean existsByCorreo(String correo);

    @Query(value = "SELECT * FROM usuarios WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<Usuario> buscarPorIdConBloqueo(@Param("id") Long id);
}