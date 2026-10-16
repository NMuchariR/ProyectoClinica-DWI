package com.avance1DWI.clinica_backend.repository;

import com.avance1DWI.clinica_backend.entity.Medico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicoRepository extends JpaRepository<Medico, Long> {
    List<Medico> findByActivoTrueOrderByNombreAsc();

    List<Medico> findByNombreAndEspecialidad(String nombre, String especialidad);

    boolean existsByNombreAndEspecialidad(String nombre, String especialidad);
}
