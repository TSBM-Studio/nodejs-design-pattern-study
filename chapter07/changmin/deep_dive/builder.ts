interface UserAttributes {
  name: string;
  age: number;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

class UserAttributesOmitBuilder {
  private constructor() {}

  private user: Partial<UserAttributes> = {};

  static getBuilder(): Omit<UserAttributesOmitBuilder, "constructor"> {
    const instance = new UserAttributesOmitBuilder();
    return instance as Omit<UserAttributesOmitBuilder, "constructor">;
  }

  setName(name: string): Omit<this, "setName"> {
    this.user.name = name;
    return this as Omit<this, "setName">;
  }

  setAge(age: number): Omit<this, "setAge"> {
    this.user.age = age;
    return this as Omit<this, "setAge">;
  }

  setEmail(email: string): Omit<this, "setEmail"> {
    this.user.email = email;
    return this as Omit<this, "setEmail">;
  }

  setPassword(password: string): Omit<this, "setPassword"> {
    this.user.password = password;
    return this as Omit<this, "setPassword">;
  }

  setPhone(phone: string): Omit<this, "setPhone"> {
    this.user.phone = phone;
    return this as Omit<this, "setPhone">;
  }

  setAddress(address: string): Omit<this, "setAddress"> {
    this.user.address = address;
    return this as Omit<this, "setAddress">;
  }

  setCity(city: string): Omit<this, "setCity"> {
    this.user.city = city;
    return this as Omit<this, "setCity">;
  }

  setState(state: string): Omit<this, "setState"> {
    this.user.state = state;
    return this as Omit<this, "setState">;
  }

  setZip(zip: string): Omit<this, "setZip"> {
    this.user.zip = zip;
    return this as Omit<this, "setZip">;
  }

  setCountry(country: string): Omit<this, "setCountry"> {
    this.user.country = country;
    return this as Omit<this, "setCountry">;
  }

  build(): UserAttributes {
    return this.user as UserAttributes;
  }
}

const user_john = UserAttributesOmitBuilder.getBuilder()
  .setName("John")
  .setAge(20)
  .build();

console.log(user_john);
