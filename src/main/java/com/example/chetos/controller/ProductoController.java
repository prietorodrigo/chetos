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
import java.util.Optional;

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

    @RequestMapping(value="/listarProductos", method=RequestMethod.GET)
    public ModelAndView getProductosCliente() {
        ModelAndView mv = new ModelAndView("listarProductos");
        List<Producto> productoList = productoRepository.findAll();
        mv.addObject("productos", productoList);
        return mv;
    }

    @RequestMapping(value="/editarProducto/{id}", method=RequestMethod.GET)
    public ModelAndView editar(@PathVariable("id") Long id) {
        ModelAndView mv = new ModelAndView("editarProducto");
        Optional<Producto> producto = productoRepository.findById(id);
        mv.addObject("nombre", producto.get().getNombre());
        mv.addObject("codigo", producto.get().getCodigo());
        mv.addObject("descripcion", producto.get().getDescripcion());
        mv.addObject("precio", producto.get().getPrecio());
        mv.addObject("descuento", producto.get().getDescuento());
        mv.addObject("genero", producto.get().getGenero());
        mv.addObject("tipo", producto.get().getTipo());
        mv.addObject("id", producto.get().getId());
        return mv;
    }

    @RequestMapping(value="/editarProducto/{id}", method=RequestMethod.POST)
    public String editarLivroBanco(Producto producto, RedirectAttributes msg) {
        Producto productoExistente = productoRepository.findById(producto.getId()).orElse(null);
        productoExistente.setNombre(producto.getNombre());
        productoExistente.setCodigo(producto.getCodigo());
        productoExistente.setDescripcion(producto.getDescripcion());
        productoExistente.setPrecio(producto.getPrecio());
        productoExistente.setDescuento(producto.getDescuento());
        productoExistente.setGenero(producto.getGenero());
        productoExistente.setTipo(producto.getTipo());
        productoRepository.save(productoExistente);
        return "redirect:/listarProductos";
    }

    @RequestMapping(value="/excluirProducto/{id}", method=RequestMethod.GET)
    public String excluirProducto(@PathVariable("id") Long id) {
        productoRepository.deleteById(id);
        return "redirect:/listarProductos";
    }

    @RequestMapping(value="/vermasProducto/{id}", method=RequestMethod.GET)
    public ModelAndView vermasProducto(@PathVariable("id") Long id) {
        ModelAndView mv = new ModelAndView("vermasProducto");
        Optional<Producto> productos = productoRepository.findById(id);
        mv.addObject("nombre", productos.get().getNombre());
        mv.addObject("descripcion", productos.get().getDescripcion());
        mv.addObject("precio", productos.get().getPrecio());
        mv.addObject("descuento", productos.get().getDescuento());
        mv.addObject("foto", productos.get().getFoto());
        return mv;
    }
}
