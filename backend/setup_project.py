import os
files = {
    'src/main/java/com/hospital/bedtracker/entity/BedStatus.java': 'package com.hospital.bedtracker.entity;
public enum BedStatus { AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE, RESERVED }
',
    'src/main/java/com/hospital/bedtracker/entity/Ward.java': 'package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;
@Entity @Data @NoArgsConstructor @AllArgsConstructor
public class Ward {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String name;
    private String location;
    @OneToMany(mappedBy = "ward", cascade = CascadeType.ALL) private List<Bed> beds;
},
