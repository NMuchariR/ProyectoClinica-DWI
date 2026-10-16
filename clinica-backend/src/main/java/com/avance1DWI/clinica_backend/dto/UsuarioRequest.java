package com.avance1DWI.clinica_backend.dto;

import com.avance1DWI.clinica_backend.enums.Rol;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UsuarioRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede pasar de 100 caracteres")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100, message = "El apellido no puede pasar de 100 caracteres")
    private String apellido;

    @NotNull(message = "El rol es obligatorio")
    private Rol rol;

    public String getNombre() {

        return nombre;
    }

    public void setNombre(String nombre) {

        this.nombre = nombre;
    }

    public String getApellido() {

        return apellido;
    }

    public void setApellido(String apellido) {

        this.apellido = apellido;
    }

    public Rol getRol() {

        return rol;
    }

    public void setRol(Rol rol) {

        this.rol = rol;
    }
}