package com.avance1DWI.clinica_backend.dto;

public record UsuarioResponse(Long id, String nombre, String apellido, String correo, String rol) {
}