package com.avance1DWI.clinica_backend.config;

import com.avance1DWI.clinica_backend.entity.Medico;
import com.avance1DWI.clinica_backend.entity.Reserva;
import com.avance1DWI.clinica_backend.entity.Servicio;
import com.avance1DWI.clinica_backend.entity.Usuario;
import com.avance1DWI.clinica_backend.enums.EstadoReserva;
import com.avance1DWI.clinica_backend.enums.Rol;
import com.avance1DWI.clinica_backend.repository.MedicoRepository;
import com.avance1DWI.clinica_backend.repository.ReservaRepository;
import com.avance1DWI.clinica_backend.repository.ServicioRepository;
import com.avance1DWI.clinica_backend.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ServicioRepository servicioRepository;
    private final MedicoRepository medicoRepository;
    private final ReservaRepository reservaRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UsuarioRepository usuarioRepository,
                           ServicioRepository servicioRepository,
                           MedicoRepository medicoRepository,
                           ReservaRepository reservaRepository,
                           PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.servicioRepository = servicioRepository;
        this.medicoRepository = medicoRepository;
        this.reservaRepository = reservaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        crearUsuarios();
        crearServicios();
        crearMedicos();
        crearReservas();
    }

    private void crearUsuarios() {
        List<UsuarioInicial> usuarios = List.of(
                new UsuarioInicial("Jhon", "Sallo", "admin@clinica.com", "sallo123", Rol.ADMINISTRADOR),
                new UsuarioInicial("Miguel", "Lopez", "mlopez@gmail.com", "lopez123", Rol.PACIENTE),
                new UsuarioInicial("Carlos", "Ramírez", "carlos@gmail.com", "carlos123", Rol.PACIENTE),
                new UsuarioInicial("María", "García", "maria@gmail.com", "maria123", Rol.PACIENTE),
                new UsuarioInicial("José", "Torres", "jose@gmail.com", "jose123", Rol.PACIENTE),
                new UsuarioInicial("Ana", "Flores", "ana@gmail.com", "ana123", Rol.PACIENTE),
                new UsuarioInicial("Laura", "Castillo", "laura@gmail.com", "laura123", Rol.PACIENTE),
                new UsuarioInicial("Pedro", "Vargas", "pedro@gmail.com", "pedro123", Rol.PACIENTE),
                new UsuarioInicial("Sofía", "Mendoza", "sofia@gmail.com", "sofia123", Rol.PACIENTE),
                new UsuarioInicial("Diego", "Rojas", "diego@gmail.com", "diego123", Rol.PACIENTE)
        );

        usuarios.forEach(u -> {
            if (usuarioRepository.findByCorreo(u.correo()).isEmpty()) {
                usuarioRepository.save(new Usuario(u.nombre(), u.apellido(), u.correo(),
                        passwordEncoder.encode(u.password()), u.rol()));
            }
        });
    }

    private void crearServicios() {
        List<ServicioInicial> servicios = List.of(
                new ServicioInicial("Consulta General", "Medicina general", "Atención médica general con evaluación completa", "80.00", 30),
                new ServicioInicial("Pediatría", "Pediatría", "Control y atención médica para niños y adolescentes", "100.00", 40),
                new ServicioInicial("Odontología", "Odontología", "Limpieza, revisión y tratamientos dentales básicos", "120.00", 45),
                new ServicioInicial("Laboratorio Clínico", "Laboratorio clínico", "Toma de muestras y análisis de sangre", "60.00", 20),
                new ServicioInicial("Consulta de Medicina Interna", "Medicina interna", "Evaluación y seguimiento integral de la salud", "100.00", 30),
                new ServicioInicial("Consulta de Cardiología", "Cardiología", "Evaluación y control de la salud cardiovascular", "130.00", 30),
                new ServicioInicial("Consulta de Dermatología", "Dermatología", "Evaluación y tratamiento de afecciones de la piel", "110.00", 30),
                new ServicioInicial("Consulta de Ginecología", "Ginecología", "Atención y control de la salud ginecológica", "120.00", 30),
                new ServicioInicial("Consulta de Oftalmología", "Oftalmología", "Evaluación de la visión y salud ocular", "110.00", 30),
                new ServicioInicial("Consulta de Traumatología", "Traumatología", "Evaluación de lesiones y afecciones musculoesqueléticas", "120.00", 30),
                new ServicioInicial("Consulta de Neurología", "Neurología", "Evaluación y seguimiento de la salud neurológica", "140.00", 30),
                new ServicioInicial("Consulta de Gastroenterología", "Gastroenterología", "Evaluación de la salud digestiva", "130.00", 30),
                new ServicioInicial("Consulta de Urología", "Urología", "Atención y evaluación urológica", "120.00", 30),
                new ServicioInicial("Consulta de Endocrinología", "Endocrinología", "Evaluación y seguimiento hormonal y metabólico", "130.00", 30),
                new ServicioInicial("Consulta de Otorrinolaringología", "Otorrinolaringología", "Atención de oído, nariz y garganta", "120.00", 30),
                new ServicioInicial("Consulta de Reumatología", "Reumatología", "Evaluación de articulaciones y enfermedades reumáticas", "130.00", 30),
                new ServicioInicial("Consulta de Neumología", "Neumología", "Evaluación de la salud respiratoria", "130.00", 30)
        );

        servicios.forEach(s -> {
            if (!servicioRepository.existsByNombre(s.nombre())) {
                servicioRepository.save(new Servicio(s.nombre(), s.especialidad(), s.descripcion(),
                        new BigDecimal(s.precio()), s.duracionMinutos(), true));
            }
        });
    }

    private void crearMedicos() {
        List<MedicoInicial> medicos = List.of(
                new MedicoInicial("Dra. Ana Torres", "Medicina general", "Sede Centro"),
                new MedicoInicial("Dr. Luis Mendoza", "Pediatría", "Sede Norte"),
                new MedicoInicial("Dra. Carla Rojas", "Odontología", "Sede Centro"),
                new MedicoInicial("Dr. José Vargas", "Medicina interna", "Sede Norte"),
                new MedicoInicial("Dra. María Castillo", "Medicina general", "Sede Norte"),
                new MedicoInicial("Tec. Rosa Salas", "Laboratorio clínico", "Sede Centro"),
                new MedicoInicial("Dra. Lucía Herrera", "Cardiología", "Sede Centro"),
                new MedicoInicial("Dr. Andrés Paredes", "Cardiología", "Sede Norte"),
                new MedicoInicial("Dra. Valeria Campos", "Dermatología", "Sede Centro"),
                new MedicoInicial("Dr. Diego Navarro", "Dermatología", "Sede Norte"),
                new MedicoInicial("Dra. Camila Mendoza", "Ginecología", "Sede Centro"),
                new MedicoInicial("Dr. Rafael Salazar", "Ginecología", "Sede Norte"),
                new MedicoInicial("Dra. Elena Ruiz", "Oftalmología", "Sede Centro"),
                new MedicoInicial("Dr. Martín Cabrera", "Oftalmología", "Sede Norte"),
                new MedicoInicial("Dra. Sofía Vega", "Traumatología", "Sede Centro"),
                new MedicoInicial("Dr. Pablo Fuentes", "Traumatología", "Sede Norte"),
                new MedicoInicial("Dra. Gabriela Ríos", "Neurología", "Sede Centro"),
                new MedicoInicial("Dr. Nicolás León", "Neurología", "Sede Norte"),
                new MedicoInicial("Dra. Daniela Flores", "Gastroenterología", "Sede Centro"),
                new MedicoInicial("Dr. Emilio Vargas", "Gastroenterología", "Sede Norte"),
                new MedicoInicial("Dra. Patricia Soto", "Urología", "Sede Centro"),
                new MedicoInicial("Dr. Sebastián Cruz", "Endocrinología", "Sede Norte"),
                new MedicoInicial("Dra. Andrea Molina", "Otorrinolaringología", "Sede Centro"),
                new MedicoInicial("Dr. Fernando Reyes", "Reumatología", "Sede Norte"),
                new MedicoInicial("Dra. Isabel Peña", "Neumología", "Sede Centro"),
                new MedicoInicial("Dr. Mauricio Silva", "Medicina interna", "Sede Centro"),
                new MedicoInicial("Dra. Natalia Chávez", "Medicina general", "Sede Centro"),
                new MedicoInicial("Dr. Ricardo Luna", "Medicina general", "Sede Norte"),
                new MedicoInicial("Dra. Julieta Acosta", "Pediatría", "Sede Centro"),
                new MedicoInicial("Dr. Samuel Ortega", "Pediatría", "Sede Norte"),
                new MedicoInicial("Dra. Teresa Aguilar", "Odontología", "Sede Norte"),
                new MedicoInicial("Dr. Bruno Espinoza", "Cardiología", "Sede Centro"),
                new MedicoInicial("Dra. Mónica Palacios", "Dermatología", "Sede Norte"),
                new MedicoInicial("Dr. Esteban Ponce", "Traumatología", "Sede Centro"),
                new MedicoInicial("Dra. Roxana Benavides", "Gastroenterología", "Sede Norte"),
                new MedicoInicial("Dra. Verónica Salas", "Medicina interna", "Sede Norte"),
                new MedicoInicial("Dra. Paula Cárdenas", "Medicina general", "Sede Sur"),
                new MedicoInicial("Dr. Tomás Ibarra", "Pediatría", "Sede Sur"),
                new MedicoInicial("Dra. Lorena Quiroz", "Odontología", "Sede Este"),
                new MedicoInicial("Dr. Álvaro Núñez", "Cardiología", "Sede Este"),
                new MedicoInicial("Dra. Mariana Soto", "Odontología", "Sede Sur"),
                new MedicoInicial("Dr. Álvaro Ponce", "Laboratorio clínico", "Sede Sur"),
                new MedicoInicial("Dra. Cecilia Rivas", "Medicina interna", "Sede Sur"),
                new MedicoInicial("Dr. Javier Montes", "Cardiología", "Sede Sur"),
                new MedicoInicial("Dra. Teresa León", "Dermatología", "Sede Sur"),
                new MedicoInicial("Dr. Felipe Arias", "Ginecología", "Sede Sur"),
                new MedicoInicial("Dra. Rocío Medina", "Oftalmología", "Sede Sur"),
                new MedicoInicial("Dr. Gabriel Rojas", "Traumatología", "Sede Sur"),
                new MedicoInicial("Dra. Diana Paredes", "Neurología", "Sede Sur"),
                new MedicoInicial("Dr. Martín Salas", "Gastroenterología", "Sede Sur"),
                new MedicoInicial("Dra. Alicia Núñez", "Urología", "Sede Sur"),
                new MedicoInicial("Dr. César Vega", "Endocrinología", "Sede Sur"),
                new MedicoInicial("Dra. Beatriz Cruz", "Otorrinolaringología", "Sede Sur"),
                new MedicoInicial("Dr. Óscar Fuentes", "Reumatología", "Sede Sur"),
                new MedicoInicial("Dra. Pilar Reyes", "Neumología", "Sede Sur"),
                new MedicoInicial("Dra. Claudia Herrera", "Medicina general", "Sede Este"),
                new MedicoInicial("Dr. Iván Campos", "Pediatría", "Sede Este"),
                new MedicoInicial("Dra. Sofía Navarro", "Laboratorio clínico", "Sede Este"),
                new MedicoInicial("Dr. Manuel Cabrera", "Medicina interna", "Sede Este"),
                new MedicoInicial("Dra. Natalia Fuentes", "Dermatología", "Sede Este"),
                new MedicoInicial("Dr. Rafael Molina", "Ginecología", "Sede Este"),
                new MedicoInicial("Dra. Lorena Castillo", "Oftalmología", "Sede Este"),
                new MedicoInicial("Dr. Pedro Acosta", "Traumatología", "Sede Este"),
                new MedicoInicial("Dra. Valentina Silva", "Neurología", "Sede Este"),
                new MedicoInicial("Dr. Andrés Ríos", "Gastroenterología", "Sede Este"),
                new MedicoInicial("Dra. Mónica Vargas", "Urología", "Sede Este"),
                new MedicoInicial("Dr. Daniel Torres", "Endocrinología", "Sede Este"),
                new MedicoInicial("Dra. Andrea Peña", "Otorrinolaringología", "Sede Este"),
                new MedicoInicial("Dr. Sebastián Flores", "Reumatología", "Sede Este"),
                new MedicoInicial("Dra. Isabel Mendoza", "Neumología", "Sede Este")
        );

        medicos.forEach(m -> {
            if (!medicoRepository.existsByNombreAndEspecialidad(m.nombre(), m.especialidad())) {
                medicoRepository.save(new Medico(m.nombre(), m.especialidad(), m.sede(), true));
            }
        });
    }

    private void crearReservas() {
        if (reservaRepository.count() > 0) {
            return;
        }

        List<ReservaInicial> reservas = List.of(
                new ReservaInicial("mlopez@gmail.com", "Consulta General", "Dr. Luis Mendoza", "Pediatría",
                        LocalDateTime.of(2026, 10, 21, 8, 30), "dolor de cabeza", null, EstadoReserva.PENDIENTE),
                new ReservaInicial("mlopez@gmail.com", "Consulta General", "Dra. Carla Rojas", "Odontología",
                        LocalDateTime.of(2026, 10, 14, 16, 30), "dolor de muela", null, EstadoReserva.CANCELADA),
                new ReservaInicial("mlopez@gmail.com", "Consulta General", "Dra. Ana Torres", "Medicina general",
                        LocalDateTime.of(2026, 10, 22, 17, 0), "resfriado", "Sede Centro", EstadoReserva.PENDIENTE),
                new ReservaInicial("diego@gmail.com", "Consulta de Dermatología", "Dra. Valeria Campos", "Dermatología",
                        LocalDateTime.of(2026, 10, 22, 15, 0), "picason en la piel", "Sede Centro", EstadoReserva.PENDIENTE),
                new ReservaInicial("diego@gmail.com", "Consulta de Urología", "Dra. Mónica Vargas", "Urología",
                        LocalDateTime.of(2026, 10, 23, 15, 0), "ll", "Sede Este", EstadoReserva.PENDIENTE),
                new ReservaInicial("mlopez@gmail.com", "Odontología", "Dra. Lorena Quiroz", "Odontología",
                        LocalDateTime.of(2026, 11, 5, 16, 0), "dolor de muela", "Sede Este", EstadoReserva.PENDIENTE)
        );

        reservas.forEach(r -> {
            Usuario usuario = usuarioRepository.findByCorreo(r.correoPaciente()).orElse(null);
            Servicio servicio = servicioRepository.buscarPorNombre(r.servicio()).stream()
                    .filter(s -> s.getNombre().equals(r.servicio()))
                    .findFirst()
                    .orElse(null);
            Medico medico = medicoRepository.findByNombreAndEspecialidad(r.medico(), r.especialidadMedico())
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (usuario != null && servicio != null && medico != null) {
                reservaRepository.save(new Reserva(usuario, servicio, medico, r.fechaHora(),
                        r.motivo(), r.sede(), r.estado()));
            }
        });
    }

    private record UsuarioInicial(String nombre, String apellido, String correo, String password, Rol rol) {
    }

    private record ServicioInicial(String nombre, String especialidad, String descripcion,
                                   String precio, int duracionMinutos) {
    }

    private record MedicoInicial(String nombre, String especialidad, String sede) {
    }

    private record ReservaInicial(String correoPaciente, String servicio, String medico,
                                  String especialidadMedico, LocalDateTime fechaHora,
                                  String motivo, String sede, EstadoReserva estado) {
    }
}
