package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "hospitals")
public class Hospital {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    private String location;
    private String contact;
    private Integer totalCapacity;
    private Boolean active = true;

    @JsonIgnore
    @OneToMany(mappedBy = "hospital", cascade = CascadeType.ALL)
    private List<Ward> wards;

    public Hospital() {}
    public Hospital(String name, String location) { this.name=name; this.location=location; this.active=true; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id=id; }
    public String getName() { return name; }
    public void setName(String name) { this.name=name; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location=location; }
    public String getContact() { return contact; }
    public void setContact(String c) { this.contact=c; }
    public Integer getTotalCapacity() { return totalCapacity; }
    public void setTotalCapacity(Integer c) { this.totalCapacity=c; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean a) { this.active=a; }
    public List<Ward> getWards() { return wards; }
    public void setWards(List<Ward> w) { this.wards=w; }
}
