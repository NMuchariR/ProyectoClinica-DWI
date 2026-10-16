package com.avance1DWI.clinica_backend.service;

import com.avance1DWI.clinica_backend.dto.ServicioRequest;
import com.avance1DWI.clinica_backend.dto.ServicioResponse;
import com.avance1DWI.clinica_backend.entity.Servicio;
import com.avance1DWI.clinica_backend.exception.RecursoNoEncontradoException;
import com.avance1DWI.clinica_backend.repository.ServicioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicioService {

    private final ServicioRepository servicioRepository;

    public ServicioService(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    public List<ServicioResponse> listar() {
        return servicioRepository.findAll().stream()
                .map(this::convertirAResponse)
                .toList();
    }

    public ServicioResponse buscarPorId(Long id) {
        return convertirAResponse(buscarEntidad(id));
    }

    public List<ServicioResponse> buscarPorNombre(String nombre) {
        return servicioRepository.buscarPorNombre(nombre.trim()).stream()
                .map(this::convertirAResponse)
                .toList();
    }

    public ServicioResponse crear(ServicioRequest request) {
        if (servicioRepository.existsByNombre(request.getNombre())) {
            throw new RuntimeException("Ya existe un servicio con ese nombre");
        }

        boolean activo = request.getActivo() == null || request.getActivo();

        Servicio nuevo = new Servicio(
                request.getNombre(),
                request.getEspecialidad().trim(),
                request.getDescripcion(),
                request.getPrecio(),
                request.getDuracionMinutos(),
                activo
        );

        return convertirAResponse(servicioRepository.save(nuevo));
    }

    public ServicioResponse actualizar(Long id, ServicioRequest request) {
        Servicio servicio = buscarEntidad(id);

        if (servicioRepository.existsByNombreAndIdNot(request.getNombre(), id)) {
            throw new RuntimeException("Ya existe otro servicio con ese nombre");
        }

        servicio.setNombre(request.getNombre());
        servicio.setEspecialidad(request.getEspecialidad().trim());
        servicio.setDescripcion(request.getDescripcion());
        servicio.setPrecio(request.getPrecio());
        servicio.setDuracionMinutos(request.getDuracionMinutos());
        if (request.getActivo() != null) {
            servicio.setActivo(request.getActivo());
        }

        return convertirAResponse(servicioRepository.save(servicio));
    }

    public void eliminar(Long id) {
        Servicio servicio = buscarEntidad(id);

        try {
            servicioRepository.delete(servicio);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException(
                    "No se puede eliminar el servicio porque tiene reservas. Desactívalo editándolo");
        }
    }

    private Servicio buscarEntidad(Long id) {
        return servicioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Servicio no encontrado"));
    }

    private ServicioResponse convertirAResponse(Servicio s) {
        return new ServicioResponse(
                s.getId(),
                s.getNombre(),
                s.getEspecialidad(),
                s.getDescripcion(),
                s.getPrecio(),
                s.getDuracionMinutos(),
                s.getActivo()
        );
    }
}