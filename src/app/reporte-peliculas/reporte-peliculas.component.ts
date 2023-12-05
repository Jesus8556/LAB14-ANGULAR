import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx'; // Importa la librería para Excel
import * as Papa from 'papaparse'; // Importa la librería para CSV

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  filtroGenero: string | undefined;
  filtroAnio: number | undefined;

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
    });
  }

  aplicarFiltros() {
    // Lógica de filtrado
    this.peliculas = this.peliculas.filter(pelicula =>
      (!this.filtroGenero || pelicula.genero.toLowerCase().includes(this.filtroGenero.toLowerCase())) &&
      (!this.filtroAnio || pelicula.lanzamiento === this.filtroAnio)
    );
  }

  limpiarFiltros() {
    // Limpiar filtros y restaurar todas las películas
    this.filtroGenero = undefined;
    this.filtroAnio = undefined;
    this.ngOnInit(); // Recargar todas las películas
  }

  generarPDF() {
    this.aplicarFiltros();

    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        style: 'tableExample',
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [{ text: 'Título', style: 'tableHeader' }, { text: 'Género', style: 'tableHeader' }, { text: 'Año de lanzamiento', style: 'tableHeader' }],
            ...this.peliculas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
          ]
        }
      }
    ];

    const estilos = {
      header: {
        fontSize: 24,
        bold: true,
        alignment: 'center',
        color: '#2e8b57' // Verde oscuro
      },
      tableExample: {
        margin: [0, 5, 0, 15],
        fontSize: 12,
        color: '#333', // Gris oscuro
      },
      tableHeader: {
        bold: true,
        fontSize: 14,
        color: '#fff', // Texto blanco
        fillColor: '#2e8b57', // Verde oscuro para el fondo del encabezado
        alignment: 'center',
        margin: [0, 5, 0, 5], // Márgenes superior e inferior
        border: [0, 0, 1, 0], // Bordes solo en la parte inferior
      }
    };

    const documentDefinition: any = {
      content: contenido,
      styles: estilos
    };

    (<any>pdfMake).createPdf(documentDefinition).open();
  }

  exportarExcel() {
    this.aplicarFiltros();

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
      ['Título', 'Género', 'Año de lanzamiento'],
      ...this.peliculas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
    ]);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Informe de Películas');
    XLSX.writeFile(wb, 'informe_peliculas.xlsx');
  }

  exportarCSV() {
    this.aplicarFiltros();

    const csvData = Papa.unparse([
      ['Título', 'Género', 'Año de lanzamiento'],
      ...this.peliculas.map(pelicula => [pelicula.titulo, pelicula.genero, pelicula.lanzamiento.toString()])
    ]);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'informe_peliculas.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
