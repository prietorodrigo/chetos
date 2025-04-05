package com.example.chetos.service;

import com.example.chetos.model.Producto;
import java.util.List;

public interface ProductoService {
    List<Producto> findAll();
    Producto findById(long id);

    Producto save(Producto producto);

}
