package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "wards")
public class Ward {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    private String location;
    private String wardType;
    private Integer floor;
    private Integer capacity;
    @ManyToOne @JoinColumn(name = "hospital_id")
    private Hospital hospital;
    @JsonIgnore
    @OneToMany(mappedBy = "ward", cascade = CascadeType.ALL)
    private List<Bed> beds;
    public Ward() {}
    public Ward(String name, String location, String wardType) { this.name=name; this.location=location; this.wardType=wardType; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id=id; }
    public String getName() { return name; }
    public void setName(String n) { this.name=n; }
    public String getLocation() { return location; }
    public void setLocation(String l) { this.location=l; }
    public String getWardType() { return wardType; }
    public void setWardType(String t) { this.wardType=t; }
    public Integer getFloor() { return floor; }
    public void setFloor(Integer f) { this.floor=f; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer c) { this.capacity=c; }
    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital h) { this.hospital=h; }
    public List<Bed> getBeds() { return beds; }
    public void setBeds(List<Bed> b) { this.beds=b; }
}
