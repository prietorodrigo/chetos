package com.example.chetos.controller;

import com.example.chetos.model.Producto;
import com.example.chetos.repository.ProductoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;

@Controller
public class ProductoController {
    @Autowired
    ProductoRepository productoRepository;

    @RequestMapping(value="/inicioP", method = RequestMethod.GET)
    public String inicio() { return "home"; }

    @RequestMapping(value="/nuevoProducto", method=RequestMethod.GET)
    public String nuevoProducto() {
        return "registrarProducto";
    }

    @RequestMapping(value="/nuevoProducto", method=RequestMethod.POST)
    public String registroProducto(@Valid Producto producto, BindingResult result, RedirectAttributes msg, @RequestParam("file") MultipartFile foto) {
        if(result.hasErrors()) {
            msg.addFlashAttribute("error", "Error al registrar. Por favor, complete todos los campos");
            return "redirect:/nuevoProducto";
        }

        producto.setFecha_alta(LocalDate.now());

        try {
            if (!foto.isEmpty()) {
                byte[] bytes = foto.getBytes();
                Path caminho = Paths.get("./src/main/resources/static/img/"+foto.getOriginalFilename());
                Files.write(caminho, bytes);
                producto.setFoto(foto.getOriginalFilename());
            }
        } catch (IOException e) {
            System.out.println("Error foto");
        }

        productoRepository.save(producto);
        msg.addFlashAttribute("suceso", "Producto registrado.");

        return "redirect:/nuevoProducto";
    }

    @RequestMapping(value="/foto/{foto}", method=RequestMethod.GET)
    @ResponseBody
    public byte[] getFotos(@PathVariable("foto") String foto) throws IOException {
        File caminho = new File ("./src/main/resources/static/img/"+foto);
        if (foto != null || foto.trim().length() > 0) {
            return Files.readAllBytes(caminho.toPath());
        }
        return null;
    }

    @RequestMapping(value="/index", method=RequestMethod.GET)
    public ModelAndView getProductos() {
        ModelAndView mv = new ModelAndView("index");
        List<Producto> productoList = productoRepository.findAll();
        mv.addObject("productos", productoList);
        return mv;
    }
}
