package com.avance1DWI.clinica_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medicos")
public class Medico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String especialidad;

    @Column
    private String sede;

    @Column(nullable = false)
    private Boolean activo;

    public Medico() {
    }

    public Medico(String nombre, String especialidad, Boolean activo) {
        this.nombre = nombre;
        this.especialidad = especialidad;
        this.activo = activo;
        this.sede = "Sede Centro";
    }

    public Medico(String nombre, String especialidad, String sede, Boolean activo) {
        this(nombre, especialidad, activo);
        this.sede = sede;
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public String getSede() {
        return sede;
    }

    public void setSede(String sede) {
        this.sede = sede;
    }

    public void setEspecialidad(String especialidad) {
        this.especialidad = especialidad;
    }

    public Boolean getActivo() {
        return activo;
    }
}
